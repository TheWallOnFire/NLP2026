import { useState, useEffect, useCallback, useRef } from 'react';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { useModelStore } from '../../learning/store/useModelStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function useSignLanguageModel(
  onDetection: (index: number, confidence: number) => void
) {
  const { customModelUri } = useModelStore();
  const { developerDebugMode } = useSettingsStore();
  const [tfliteModel, setTfliteModel] = useState<any>(null);
  const frameQueue = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      if (!customModelUri) {
        setTfliteModel(null);
        return;
      }
      try {
        const m = await loadTensorflowModel({ url: customModelUri }, []);
        if (isMounted) {
          setTfliteModel(m);
        }
      } catch (e) {
        console.error("Fast TFLite Load Error:", e);
      }
    };
    loadModel();
    return () => { isMounted = false; };
  }, [customModelUri]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || frameQueue.current.length === 0 || !tfliteModel) {
      return;
    }

    isProcessingRef.current = true;
    const uri = frameQueue.current.shift();
    const startTime = Date.now();

    if (!uri) {
      isProcessingRef.current = false;
      return;
    }

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
      if (uri.startsWith('file://') || uri.startsWith('http')) {
        image = await loadImage({ url: uri });
      } else {
        image = await loadImage({ filePath: uri });
      }

      const resized = await image.resizeAsync(width, height);
      const pixelBuffer = await resized.toRawPixelData();
      const uint8Array = new Uint8Array(pixelBuffer);

      let inputData: Float32Array | Uint8Array = uint8Array;
      
      if (tfliteModel.inputs?.[0]?.dataType === 'float32') {
        const float32Array = new Float32Array(uint8Array.length);
        
        // Yield to the JS thread to prevent UI freezing during the heavy array loop
        await new Promise(resolve => setTimeout(resolve, 0));
        
        for (let i = 0; i < uint8Array.length; i++) {
          float32Array[i] = uint8Array[i] / 255.0;
        }
        inputData = float32Array;
      }

      const outputs = tfliteModel.runSync([inputData]);
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
    } catch (e) {
      console.error("TFLite inference error:", e);
      if (developerDebugMode) {
        console.log(`[ML Debug] Hoàn thành trong ${Date.now() - startTime}ms. Queue length: ${frameQueue.current.length}`);
      }
      isProcessingRef.current = false;
      if (frameQueue.current.length > 0) {
        // Schedule next processing on next tick to avoid synchronous block
        setTimeout(() => processQueue(), 0);
      }
    }
  }, [tfliteModel, onDetection]);

  const runDetection = useCallback((uri?: string) => {
    if (!uri) return;

    // "kiểm tra xem ảnh mới chụp có giống ảnh mới nhất trong hàng chờ hay không và nếu giống thì bỏ qua ảnh đó."
    if (frameQueue.current.length > 0 && frameQueue.current[frameQueue.current.length - 1] === uri) {
      return;
    }

    // "giữ tối đa 10 ảnh trong hàng chờ, tự drop ảnh chưa vào queue nếu queue đầy"
    if (frameQueue.current.length >= 10) {
      return; 
    }

    if (developerDebugMode) {
      console.log(`[ML Debug] Nhận ảnh mới. Đẩy vào Queue. Tổng Queue: ${frameQueue.current.length}`);
    }
    processQueue();
  }, [processQueue, developerDebugMode]);

  return { 
    runDetection, 
    isModelReady: tfliteModel != null,
    getDebugInfo: () => ({
      queueLength: frameQueue.current.length,
      isProcessing: isProcessingRef.current,
      queue: [...frameQueue.current]
    })
  };
}
