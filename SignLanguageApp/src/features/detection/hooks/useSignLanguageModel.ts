import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { useModelStore } from '../../learning/store/useModelStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import * as FileSystem from 'expo-file-system/legacy';
import { prepareImageForModel, convertPixelsToInputData } from '../utils/imageProcessor';
import { parseInferenceOutput } from '../utils/modelOutputParser';

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
      const shape = tfliteModel.inputs?.[0]?.shape;
      const dataType = tfliteModel.inputs?.[0]?.dataType;
      
      const { uint8Array, expectedElements, isRGBA, channels } = await prepareImageForModel(uri, shape);
      
      const inputData = await convertPixelsToInputData(uint8Array, expectedElements, isRGBA, channels, dataType);

      const outputs = await tfliteModel.run([inputData.buffer]);
      
      const outDataType = tfliteModel.outputs?.[0]?.dataType;
      const result = parseInferenceOutput(outputs, outDataType);

      if (result) {
        const { maxIdx, maxVal } = result;
        console.log(`[ML Debug] Model inference xong. maxIdx: ${maxIdx}, maxVal: ${maxVal.toFixed(3)}`);
        
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

  const runDetection = useCallback((uri?: string, bypassDuplicateCheck: boolean = false) => {
    if (!uri) return { success: false, message: "Không tìm thấy đường dẫn ảnh." };

    if (!bypassDuplicateCheck && frameQueue.current.length > 0 && frameQueue.current[frameQueue.current.length - 1] === uri) {
      return { success: false, message: "Ảnh này đang được xử lý hoặc đã có trong hàng đợi rồi." };
    }

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
