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
  
  // Thay vì Center Crop, ta thực hiện Resize thẳng (Squish/bóp méo) để bảo toàn mọi chi tiết viền ảnh
  try {
    const manipActions: any[] = [];
    
    manipActions.push({ resize: { width, height } });

    if (facing === 'front') {
      manipActions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      manipActions,
      { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
    );
    finalUriToLoad = manipResult.uri;
    console.log(`[ML Debug] Đã Resize (${width}x${height}) và bóp méo khung hình: ${finalUriToLoad}`);
  } catch (manipErr) {
    console.warn(`[ML Debug] Không thể dùng ImageManipulator (Resize), fallback về ảnh gốc. Lỗi:`, manipErr);
  }

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

    image = await loadImage({ filePath: cleanPath }); // Dùng filePath thay vì url để tránh lỗi "Web Images are not supported"
  }

  // Bỏ qua resizeAsync vì ImageManipulator đã resize chính xác về width x height rồi
  const rawData = await image.toRawPixelData();
  // Lỗi thực sự là do toRawPixelData() trả về object { buffer, width, height, pixelFormat } chứ không phải ArrayBuffer!
  // Gọi new Uint8Array() trực tiếp lên object này sẽ tạo ra mảng rỗng (Length 0).
  const pixelBuffer = rawData.buffer || rawData; 
  const uint8Array = new Uint8Array(pixelBuffer);

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
  
  if (dataType === 'float32') {
    const float32Array = new Float32Array(expectedElements);
    
    if (isRGBA && expectedChannels === 3) {
      let floatIdx = 0;
      const format = pixelFormat.toLowerCase();
      
      for (let i = 0; i < uint8Array.length && floatIdx < expectedElements; i += 4) {
        let r = 0, g = 0, b = 0;
        if (format === 'bgra') {
          b = uint8Array[i];
          g = uint8Array[i+1];
          r = uint8Array[i+2];
        } else if (format === 'argb') {
          r = uint8Array[i+1];
          g = uint8Array[i+2];
          b = uint8Array[i+3];
        } else { // rgba, xrgb, etc.
          r = uint8Array[i];
          g = uint8Array[i+1];
          b = uint8Array[i+2];
        }

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
