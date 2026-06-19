import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export async function prepareImageForModel(uri: string, shape: number[] | undefined) {
  const { loadImage } = require('react-native-nitro-image');
  
  let width = 224;
  let height = 224;
  if (shape && shape.length >= 3) {
    width = shape[1] > 10 ? shape[1] : 224;
    height = shape[2] > 10 ? shape[2] : 224;
  }

  let image;
  let finalUriToLoad = uri;
  
  // Chuẩn hoá ảnh bằng Expo Image Manipulator trước để tránh lỗi Nitro Image không đọc được (trả về ma trận 0)
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
    );
    finalUriToLoad = manipResult.uri;
    console.log(`[ML Debug] Đã chuẩn hoá ảnh qua ImageManipulator: ${finalUriToLoad}`);
  } catch (manipErr) {
    console.warn(`[ML Debug] Không thể dùng ImageManipulator, fallback về ảnh gốc. Lỗi:`, manipErr);
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

    image = await loadImage({ filePath: cleanPath });
  }

  const resized = await image.resizeAsync(width, height);
  const pixelBuffer = await resized.toRawPixelData();
  const uint8Array = new Uint8Array(pixelBuffer);

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

  return { uint8Array, expectedElements, isRGBA, expectedChannels };
}

export async function convertPixelsToInputData(
  uint8Array: Uint8Array, 
  expectedElements: number, 
  isRGBA: boolean, 
  expectedChannels: number, 
  dataType: string | undefined
): Promise<Float32Array | Uint8Array> {
  // Yield to the JS thread to prevent UI freezing before heavy array loop
  await new Promise(resolve => setTimeout(resolve, 0));

  const INV_255 = 0.003921568627451; 
  
  if (dataType === 'float32') {
    const float32Array = new Float32Array(expectedElements);
    
    if (isRGBA && expectedChannels === 3) {
      let floatIdx = 0;
      const chunkSize = 40000; // 10,000 pixels = 40,000 bytes
      
      for (let start = 0; start < uint8Array.length && floatIdx < expectedElements; start += chunkSize) {
        const end = Math.min(start + chunkSize, uint8Array.length);
        for (let i = start; i < end && floatIdx < expectedElements; i += 4) {
          float32Array[floatIdx++] = uint8Array[i] * INV_255;
          float32Array[floatIdx++] = uint8Array[i+1] * INV_255;
          float32Array[floatIdx++] = uint8Array[i+2] * INV_255;
        }
        await new Promise(resolve => setImmediate(resolve));
      }
    } else if (!isRGBA && expectedChannels === 3) {
      // Đầu vào là RGB (không có Alpha) và Model cần RGB
      const chunkSize = 10000;
      for (let start = 0; start < uint8Array.length && start < expectedElements; start += chunkSize) {
        const end = Math.min(start + chunkSize, uint8Array.length, expectedElements);
        for (let i = start; i < end; i++) {
          float32Array[i] = uint8Array[i] * INV_255;
        }
        await new Promise(resolve => setImmediate(resolve));
      }
    } else {
      // Các trường hợp khác (Grayscale, v.v.)
      const chunkSize = 10000;
      for (let start = 0; start < uint8Array.length && start < expectedElements; start += chunkSize) {
        const end = Math.min(start + chunkSize, uint8Array.length, expectedElements);
        for (let i = start; i < end; i++) {
          float32Array[i] = uint8Array[i] * INV_255;
        }
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    return float32Array;
  } else {
    if (isRGBA && expectedChannels === 3) {
      const rgbArray = new Uint8Array(expectedElements);
      let idx = 0;
      const chunkSize = 40000;
      
      for (let start = 0; start < uint8Array.length && idx < expectedElements; start += chunkSize) {
        const end = Math.min(start + chunkSize, uint8Array.length);
        for (let i = start; i < end && idx < expectedElements; i += 4) {
          rgbArray[idx++] = uint8Array[i];
          rgbArray[idx++] = uint8Array[i+1];
          rgbArray[idx++] = uint8Array[i+2];
        }
        await new Promise(resolve => setImmediate(resolve));
      }
      return rgbArray;
    } else {
      return uint8Array;
    }
  }
}
