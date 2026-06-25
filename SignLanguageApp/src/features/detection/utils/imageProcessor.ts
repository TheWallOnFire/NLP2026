import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export async function prepareImageForModel(uri: string, shape: number[] | undefined, facing?: 'front' | 'back') {
  const { loadImage } = require('react-native-nitro-image');
  
  let width = 224;
  let height = 224;
  if (shape && shape.length >= 3) {
    width = shape[1] > 10 ? shape[1] : 224;
    height = shape[2] > 10 ? shape[2] : 224;
  }

  let image;
  let finalUriToLoad = uri;
  
  // Fix Bug: Center Crop ảnh trước khi Resize để chống bóp méo tỷ lệ (Aspect Ratio Distortion)
  try {
    const { Image } = require('react-native');
    const getImageSize = () => new Promise<{w: number, h: number}>((resolve) => {
      Image.getSize(uri, (w: number, h: number) => resolve({w, h}), () => resolve({w: 0, h: 0}));
    });
    
    const sizeStart = Date.now();
    const size = await getImageSize();
    const manipActions: any[] = [];
    
    if (size.w > 0 && size.h > 0) {
      const shortest = Math.min(size.w, size.h);
      // Fix Bug 16: Ép kiểu nguyên (Floor) để tránh lỗi văng App khi truyền tọa độ lẻ (Float) vào Native C++
      const originX = Math.floor((size.w - shortest) / 2);
      const originY = Math.floor((size.h - shortest) / 2);
      manipActions.push({ crop: { originX, originY, width: shortest, height: shortest } });
    }
    
    manipActions.push({ resize: { width, height } });

    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      manipActions,
      { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
    );
    finalUriToLoad = manipResult.uri;
    const manipTime = Date.now() - sizeStart;
    console.log(`[ML Debug - Profiler] ImageManipulator xử lý Crop/Resize mất ${manipTime}ms. Kết quả: ${finalUriToLoad}`);
  } catch (manipErr) {
    console.warn(`[ML Debug] Lỗi ImageManipulator, fallback ảnh gốc:`, manipErr);
  }

  const loadStart = Date.now();
  if (finalUriToLoad.startsWith('http://') || finalUriToLoad.startsWith('https://')) {
    image = await loadImage({ url: finalUriToLoad });
  } else {
    const cleanPath = finalUriToLoad.startsWith('file://') ? finalUriToLoad.replace('file://', '') : finalUriToLoad;
    const fileUri = `file://${cleanPath}`;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        console.error(`[ML Debug] LỖI: File ảnh không tồn tại trên ổ cứng! Path: ${fileUri}`);
        throw new Error(`File ảnh không tồn tại: ${fileUri}`);
      } else {
        console.log(`[ML Debug] File hợp lệ, dung lượng: ${fileInfo.size} bytes. Tiến hành đọc ảnh...`);
      }
    } catch (fsErr) {
      console.warn(`[ML Debug] Không thể kiểm tra fileInfo, tiếp tục đọc ảnh... Lỗi:`, fsErr);
    }

    image = await loadImage({ filePath: cleanPath });
  }
  const loadTime = Date.now() - loadStart;
  console.log(`[ML Debug - Profiler] Nitro loadImage đọc ảnh vào RAM mất ${loadTime}ms.`);

  const pixelStart = Date.now();
  // Bỏ qua resizeAsync vì ImageManipulator đã resize chính xác về width x height rồi
  const rawData = await image.toRawPixelData();
  const pixelBuffer = rawData.buffer || rawData; 
  const uint8Array = new Uint8Array(pixelBuffer);
  
  const pixelTime = Date.now() - pixelStart;
  console.log(`[ML Debug - Profiler] Trích xuất ${uint8Array.length} bytes RawPixelData mất ${pixelTime}ms.`);

  if (uint8Array.length === 0) {
    throw new Error("Lỗi bộ nhớ: Không trích xuất được pixel data (Buffer rỗng, nguy cơ văng TFLite C++).");
  }

  let hasData = false;
  for (let i = 0; i < 100 && i < uint8Array.length; i++) {
    if (uint8Array[i] > 0) {
      hasData = true; break;
    }
  }
  console.log(`[ML Debug] Pixel buffer extracted. Length: ${uint8Array.length}. Has Non-Zero Data: ${hasData}`);

  const expectedElements = shape?.reduce((a: number, b: number) => a * b, 1) || (width * height * 3);
  const isRGBA = uint8Array.length === width * height * 4;
  
  // Tự động suy luận số lượng channels model cần (dựa trên expectedElements)
  const expectedChannels = expectedElements / (width * height);
  const pixelFormat = rawData.pixelFormat || 'unknown';

  return { uint8Array, expectedElements, isRGBA, expectedChannels, pixelFormat };
}

export async function convertPixelsToInputData(
  uint8Array: Uint8Array, 
  expectedElements: number, 
  isRGBA: boolean, 
  expectedChannels: number, 
  dataType: string | undefined,
  pixelFormat: string = 'unknown',
  normalizationType: '[-1, 1]' | '[0, 1]' | '[0, 255]' = '[0, 1]'
): Promise<Float32Array | Uint8Array> {
  const INV_255 = 0.00392156862; // 1 / 255.0
  const INV_127_5 = 0.0078431372549; // 1 / 127.5
  
  const convertStart = Date.now();
  
  if (dataType === 'float32') {
    const float32Array = new Float32Array(expectedElements);
    
    if (isRGBA && expectedChannels === 3) {
      let floatIdx = 0;
      const format = pixelFormat.toLowerCase();
      
      for (let i = 0; i < expectedElements * 4 && i < uint8Array.length; i += 4) {
        let r = 0, g = 0, b = 0, a = 255;
        if (format === 'bgra') {
          b = uint8Array[i];
          g = uint8Array[i+1];
          r = uint8Array[i+2];
          a = uint8Array[i+3];
        } else if (format === 'argb') {
          a = uint8Array[i];
          r = uint8Array[i+1];
          g = uint8Array[i+2];
          b = uint8Array[i+3];
        } else { // rgba
          r = uint8Array[i];
          g = uint8Array[i+1];
          b = uint8Array[i+2];
          a = uint8Array[i+3];
        }

        // Bug 21: Trộn kênh Alpha (Độ trong suốt) với nền trắng (White Background) để tránh ảnh PNG bị đen thui
        if (a < 255) {
          const alphaFactor = a / 255.0;
          r = Math.round(r * alphaFactor + 255 * (1 - alphaFactor));
          g = Math.round(g * alphaFactor + 255 * (1 - alphaFactor));
          b = Math.round(b * alphaFactor + 255 * (1 - alphaFactor));
        }

        if (floatIdx >= float32Array.length) break;

        if (normalizationType === '[-1, 1]') {
          float32Array[floatIdx++] = r * INV_127_5 - 1.0;
          float32Array[floatIdx++] = g * INV_127_5 - 1.0;
          float32Array[floatIdx++] = b * INV_127_5 - 1.0;
        } else if (normalizationType === '[0, 255]') {
          float32Array[floatIdx++] = r;
          float32Array[floatIdx++] = g;
          float32Array[floatIdx++] = b;
        } else {
          // Chuẩn hóa mặc định [0, 1]
          float32Array[floatIdx++] = r * INV_255;
          float32Array[floatIdx++] = g * INV_255;
          float32Array[floatIdx++] = b * INV_255;
        }
      }
    } else if (!isRGBA && expectedChannels === 3) {
      for (let i = 0; i < uint8Array.length && i < expectedElements; i++) {
        if (normalizationType === '[-1, 1]') float32Array[i] = uint8Array[i] * INV_127_5 - 1.0;
        else if (normalizationType === '[0, 255]') float32Array[i] = uint8Array[i];
        else float32Array[i] = uint8Array[i] * INV_255;
      }
    } else {
      for (let i = 0; i < uint8Array.length && i < expectedElements; i++) {
        if (normalizationType === '[-1, 1]') float32Array[i] = uint8Array[i] * INV_127_5 - 1.0;
        else if (normalizationType === '[0, 255]') float32Array[i] = uint8Array[i];
        else float32Array[i] = uint8Array[i] * INV_255;
      }
    }
    
    const convertTime = Date.now() - convertStart;
    console.log(`[ML Debug - Profiler] Ép kiểu ${expectedElements} phần tử sang Float32Array mất ${convertTime}ms.`);
    
    return float32Array;
  } else {
    if (isRGBA && expectedChannels === 3) {
      const rgbArray = new Uint8Array(expectedElements);
      let idx = 0;
      
      for (let i = 0; i < uint8Array.length && idx < expectedElements; i += 4) {
        rgbArray[idx++] = uint8Array[i];
        rgbArray[idx++] = uint8Array[i+1];
        rgbArray[idx++] = uint8Array[i+2];
      }
      return rgbArray;
    } else {
      return uint8Array;
    }
  }
}
