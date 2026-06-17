import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { useModelStore } from '../../learning/store/useModelStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import * as FileSystem from 'expo-file-system/legacy';

export function useSignLanguageModel(
  onDetection: (index: number, confidence: number) => void
) {
  const { customModelUri, activePackId } = useModelStore();
  const { developerDebugMode } = useSettingsStore();
  const [tfliteModel, setTfliteModel] = useState<any>(null);
  const frameQueue = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const processingItemRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      let urlToLoad = customModelUri;

      if (!urlToLoad && activePackId) {
        urlToLoad = `${FileSystem.documentDirectory}packs/${activePackId}/model.tflite`;
      }

      if (!urlToLoad) {
        setTfliteModel(null);
        return;
      }
      
      try {
        const m = await loadTensorflowModel({ url: urlToLoad }, []);
        if (isMounted) {
          setTfliteModel(m);
        }
      } catch (e) {
        console.error("Fast TFLite Load Error:", e);
      }
    };
    loadModel();
    return () => { isMounted = false; };
  }, [customModelUri, activePackId]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || frameQueue.current.length === 0 || !tfliteModel) {
      return;
    }

    isProcessingRef.current = true;
    const uri = frameQueue.current.shift();
    if (!uri) {
      isProcessingRef.current = false;
      return;
    }
    processingItemRef.current = uri;

    const startTime = Date.now();

    if (developerDebugMode) {
      console.log(`[ML Debug] Bắt đầu xử lý ảnh. Hàng chờ còn lại: ${frameQueue.current.length}`);
    }

    try {
      const { loadImage } = require('react-native-nitro-image');
      
      let width = 224;
      let height = 224;
      const shape = tfliteModel.inputs?.[0]?.shape;
      if (shape && shape.length >= 3) {
        width = shape[1] > 10 ? shape[1] : 224;
        height = shape[2] > 10 ? shape[2] : 224;
      }

      let image;
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        image = await loadImage({ url: uri });
      } else {
        // Remove file:// prefix as nitro-image treats local paths via filePath
        const cleanPath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
        image = await loadImage({ filePath: cleanPath });
      }

      const resized = await image.resizeAsync(width, height);
      const pixelBuffer = await resized.toRawPixelData();
      const uint8Array = new Uint8Array(pixelBuffer);

      const expectedElements = tfliteModel.inputs?.[0]?.shape?.reduce((a: number, b: number) => a * b, 1) || (width * height * 3);
      const isRGBA = uint8Array.length === width * height * 4;
      const channels = tfliteModel.inputs?.[0]?.shape?.[3] || 3;
      
      let inputData: Float32Array | Uint8Array;

      // Yield to the JS thread to prevent UI freezing before heavy array loop
      await new Promise(resolve => setTimeout(resolve, 0));

      if (tfliteModel.inputs?.[0]?.dataType === 'float32') {
        const float32Array = new Float32Array(expectedElements);
        
        if (isRGBA && channels === 3) {
          let floatIdx = 0;
          for (let i = 0; i < uint8Array.length && floatIdx < expectedElements; i += 4) {
            float32Array[floatIdx++] = uint8Array[i] / 255.0;
            float32Array[floatIdx++] = uint8Array[i+1] / 255.0;
            float32Array[floatIdx++] = uint8Array[i+2] / 255.0;
          }
        } else {
          for (let i = 0; i < uint8Array.length && i < expectedElements; i++) {
            float32Array[i] = uint8Array[i] / 255.0;
          }
        }
        inputData = float32Array;
      } else {
        if (isRGBA && channels === 3) {
          const rgbArray = new Uint8Array(expectedElements);
          let idx = 0;
          for (let i = 0; i < uint8Array.length && idx < expectedElements; i += 4) {
            rgbArray[idx++] = uint8Array[i];
            rgbArray[idx++] = uint8Array[i+1];
            rgbArray[idx++] = uint8Array[i+2];
          }
          inputData = rgbArray;
        } else {
          inputData = uint8Array;
        }
      }

      const outputs = await tfliteModel.run([inputData.buffer]);
      if (outputs && outputs.length > 0) {
        const outputArray = outputs[0] as number[];

        let maxIdx = 0;
        let maxVal = outputArray[0];
        for (let i = 1; i < outputArray.length; i++) {
          if (outputArray[i] > maxVal) {
            maxVal = outputArray[i];
            maxIdx = i;
          }
        }

        if (maxVal > 0.5) {
          onDetection(maxIdx, maxVal);
        }
      }
    } catch (e: any) {
      console.error("TFLite inference error:", e);
      if (developerDebugMode) {
        Alert.alert("ML Inference Error", e?.message || String(e));
      }
    } finally {
      if (developerDebugMode) {
        console.log(`[ML Debug] Hoàn thành trong ${Date.now() - startTime}ms. Queue length: ${frameQueue.current.length}`);
      }
      processingItemRef.current = null;
      isProcessingRef.current = false;
      if (frameQueue.current.length > 0) {
        // Schedule next processing on next tick to avoid synchronous block
        setTimeout(() => processQueue(), 0);
      }
    }
  }, [tfliteModel, onDetection]);

  const runDetection = useCallback((uri?: string) => {
    if (!uri) return { success: false, message: "Không tìm thấy đường dẫn ảnh." };

    // "kiểm tra xem ảnh mới chụp có giống ảnh mới nhất trong hàng chờ hay không và nếu giống thì bỏ qua ảnh đó."
    if (frameQueue.current.length > 0 && frameQueue.current[frameQueue.current.length - 1] === uri) {
      return { success: false, message: "Ảnh này đang được xử lý hoặc đã có trong hàng đợi rồi." };
    }

    // "giữ tối đa 10 ảnh trong hàng chờ, tự drop ảnh chưa vào queue nếu queue đầy"
    if (frameQueue.current.length >= 10) {
      return { success: false, message: "Hàng đợi đã đầy (Tối đa 10). Vui lòng đợi xử lý bớt." }; 
    }

    frameQueue.current.push(uri);

    if (developerDebugMode) {
      console.log(`[ML Debug] Nhận ảnh mới. Đẩy vào Queue. Tổng Queue: ${frameQueue.current.length}`);
    }
    processQueue();
    return { success: true, message: "Đã tiếp nhận và đưa ảnh vào hàng đợi!" };
  }, [processQueue, developerDebugMode]);

  const getDebugInfo = useCallback(() => ({
    queueLength: frameQueue.current.length,
    isProcessing: isProcessingRef.current,
    processingItem: processingItemRef.current,
    queue: [...frameQueue.current]
  }), []);

  return { 
    runDetection, 
    isModelReady: tfliteModel != null,
    getDebugInfo
  };
}
