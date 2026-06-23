import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { NitroModules } from 'react-native-nitro-modules';
import { useModelStore } from '../../learning/store/useModelStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import * as FileSystem from 'expo-file-system/legacy';
import { prepareImageForModel, convertPixelsToInputData } from '../utils/imageProcessor';
import { parseInferenceOutput } from '../utils/modelOutputParser';

export function useSignLanguageModel(
  onDetection: (index: number, confidence: number) => void,
  onError?: (errorMessage: string) => void
) {
  const { customModelUri, activePackId } = useModelStore();
  const { developerDebugMode } = useSettingsStore();
  const [tfliteModel, setTfliteModel] = useState<any>(null);
  const frameQueue = useRef<{uri: string, facing?: 'front' | 'back'}[]>([]);
  const isProcessingRef = useRef(false);
  const processingItemRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Debug Metrics
  const [metrics, setMetrics] = useState({
    preprocessTime: 0,
    inferenceTime: 0,
    totalTime: 0,
    fps: 0,
    top3: [] as {idx: number, val: number}[]
  });

  useEffect(() => {
    isMountedRef.current = true;
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
        let m;
        if (Platform.OS === 'ios') {
          try {
            m = await loadTensorflowModel({ url: urlToLoad }, ['core-ml']);
          } catch (e) {
            m = await loadTensorflowModel({ url: urlToLoad }, []);
          }
        } else {
          try {
            m = await loadTensorflowModel({ url: urlToLoad }, ['nnapi']);
          } catch (e) {
            m = await loadTensorflowModel({ url: urlToLoad }, []);
          }
        }
        if (isMounted) setTfliteModel(m);
      } catch (cpuError: any) {
        console.error("Fast TFLite Load Error:", cpuError);
        if (isMounted && urlToLoad === customModelUri) {
          Alert.alert("Lỗi tải Model", "Tệp Model bạn vừa chọn không đúng định dạng .tflite chuẩn hoặc bị hỏng.");
        }
      }
    };
    loadModel();
    return () => { 
      isMounted = false; 
      isMountedRef.current = false;
    };
  }, [customModelUri, activePackId]);

  useEffect(() => {
    return () => {
      if (tfliteModel && typeof tfliteModel.release === 'function') {
        tfliteModel.release();
      }
    };
  }, [tfliteModel]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || frameQueue.current.length === 0 || !tfliteModel) {
      return;
    }

    isProcessingRef.current = true;
    const item = frameQueue.current.shift();
    if (!item || !item.uri) {
      isProcessingRef.current = false;
      return;
    }
    const { uri, facing } = item;
    processingItemRef.current = uri;

    const startTime = Date.now();

    if (developerDebugMode) {
      console.log(`[ML Debug] Bắt đầu xử lý ảnh. Hàng chờ còn lại: ${frameQueue.current.length}`);
    }

    try {
      const shape = tfliteModel.inputs?.[0]?.shape;
      const dataType = tfliteModel.inputs?.[0]?.dataType;
      
      const preStartTime = Date.now();
      const { uint8Array, expectedElements, isRGBA, expectedChannels, pixelFormat } = await prepareImageForModel(uri, shape, facing);
      const inputData = await convertPixelsToInputData(uint8Array, expectedElements, isRGBA, expectedChannels, dataType, pixelFormat);
      const preprocessTime = Date.now() - preStartTime;

      const infStartTime = Date.now();
      const outputs = await tfliteModel.run([inputData]); // Truyền trực tiếp TypedArray, không phải .buffer
      const inferenceTime = Date.now() - infStartTime;
      
      const outDataType = tfliteModel.outputs?.[0]?.dataType;
      const result = parseInferenceOutput(outputs, outDataType);

      const totalTime = Date.now() - startTime;
      const fps = totalTime > 0 ? Math.round(1000 / totalTime) : 0;

      if (result) {
        const { maxIdx, maxVal, top3 } = result;
        
        if (developerDebugMode && isMountedRef.current) {
          setMetrics({ preprocessTime, inferenceTime, totalTime, fps, top3 });
        }

        console.log(`[ML Debug] Model inference xong. maxIdx: ${maxIdx}, maxVal: ${maxVal.toFixed(3)} | Time: ${totalTime}ms (Pre: ${preprocessTime}ms, Inf: ${inferenceTime}ms)`);
        
        const threshold = useSettingsStore.getState().detection?.threshold || 0.5;
        if (maxVal > threshold && isMountedRef.current) {
          onDetection(maxIdx, maxVal);
        }
      }
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      console.error("TFLite inference error:", errMsg);
      if (isMountedRef.current) {
        if (onError) onError(`Lỗi Model: ${errMsg}`);
        if (developerDebugMode) {
          Alert.alert("ML Inference Error", errMsg);
        }
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

  const runDetection = useCallback((uri?: string, facing?: 'front' | 'back', bypassDuplicateCheck: boolean = false) => {
    if (!uri) return { success: false, message: "Không tìm thấy đường dẫn ảnh." };

    if (!bypassDuplicateCheck && frameQueue.current.length > 0 && frameQueue.current[frameQueue.current.length - 1].uri === uri) {
      return { success: false, message: "Ảnh này đang được xử lý hoặc đã có trong hàng đợi rồi." };
    }

    if (frameQueue.current.length >= 1) {
      return { success: false, message: "Hàng đợi đang xử lý, ảnh bị drop để tránh tràn RAM." }; 
    }

    frameQueue.current.push({ uri, facing });

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
    queue: [...frameQueue.current],
    metrics
  }), [metrics]);

  const clearQueue = useCallback(() => {
    frameQueue.current = [];
  }, []);

  const boxedModel = useMemo(() => {
    if (tfliteModel && typeof tfliteModel.runSync === 'function') {
      return NitroModules.box(tfliteModel);
    }
    return undefined;
  }, [tfliteModel]);

  return { 
    runDetection, 
    isModelReady: tfliteModel != null,
    boxedModel,
    getDebugInfo,
    clearQueue
  };
}
