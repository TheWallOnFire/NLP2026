import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { NitroModules } from 'react-native-nitro-modules';
import { useModelStore } from '../../learning/store/useModelStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import * as FileSystem from 'expo-file-system/legacy';
import { prepareImageForModel, convertPixelsToInputData } from '../utils/imageProcessor';
import { parseInferenceOutput } from '../utils/modelOutputParser';
import i18n from '../../../core/i18n';

export function useSignLanguageModel(
  onDetection: (index: number, confidence: number) => void,
  onError?: (errorMessage: string) => void,
  overridePackId?: string
) {
  const { customModelUri, activePackId: globalActivePackId, packs } = useModelStore();
  const activePackId = overridePackId || globalActivePackId;
  const activePack = useMemo(() => packs.find(p => p.id === activePackId), [packs, activePackId]);
  const { packWords } = useLearningStore();
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
            m = await loadTensorflowModel({ url: urlToLoad }, []); // Vô hiệu hóa NNAPI để tránh lỗi cache buffer trên Android
          } catch (e) {
            console.error("Lỗi khi load model trên Android:", e);
          }
        }
        if (isMounted) setTfliteModel(m);
      } catch (cpuError: any) {
        console.error("Fast TFLite Load Error:", cpuError);
        if (isMounted && urlToLoad === customModelUri) {
          Alert.alert(i18n.t('detection.modelLoadError'), i18n.t('detection.corruptedModel'));
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

  useEffect(() => {
    let isActive = true;
    
    const processLoop = async () => {
      while (isActive) {
        if (frameQueue.current.length > 0 && tfliteModel && !isProcessingRef.current) {
          isProcessingRef.current = true;
          const item = frameQueue.current.shift();
          
          if (!item || !item.uri) {
            isProcessingRef.current = false;
            continue;
          }
          
          const { uri, facing } = item;
          processingItemRef.current = uri;
          const startTime = Date.now();

          if (developerDebugMode) {
            console.log(`[ML Debug] Bắt đầu xử lý ảnh. Hàng chờ còn lại: ${frameQueue.current.length}`);
          }

          try {
            let shape = tfliteModel.inputs?.[0]?.shape;
            
            if (!shape || shape.length < 3) {
              if (activePack?.inputShape && activePack.inputShape.length >= 3) {
                shape = activePack.inputShape;
              } else if (processingItemRef.current?.toLowerCase().includes('mobilenetv2') || activePackId?.toLowerCase().includes('mobilenetv2')) {
                 shape = [1, 96, 96, 3];
              } else {
                 shape = [1, 224, 224, 3];
              }
            }
            
            const dataType = tfliteModel.inputs?.[0]?.dataType;
            
            const preStartTime = Date.now();
            const { uint8Array, expectedElements, isRGBA, expectedChannels, pixelFormat } = await prepareImageForModel(uri, shape, facing);
            const inputData = await convertPixelsToInputData(uint8Array, expectedElements, isRGBA, expectedChannels, dataType, pixelFormat);
            const preprocessTime = Date.now() - preStartTime;

            if (developerDebugMode) {
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i];
              
              const first5 = Array.from(inputData.slice(0, 5)).map(v => v.toFixed(6));
              const modelInfo = activePack ? `[${activePack.name} - v${activePack.version}]` : (customModelUri ? '[Custom Model]' : '[Unknown Model]');
              
              console.log(`[ML Debug] --- Bắt đầu Inference: ${modelInfo} ---`);
              console.log(`[ML Debug] Input Tensor -> Shape: ${JSON.stringify(shape)}, DataType: ${dataType}, ArrayLength: ${inputData.length}, Sum: ${sum.toFixed(6)}`);
              console.log(`[ML Debug] Input Data Preview (${inputData.length} phần tử): [${first5.join(', ')}...]`);
            }

            const infStartTime = Date.now();
            const outputs = tfliteModel.runSync([inputData.buffer]);
            const inferenceTime = Date.now() - infStartTime;
            
            const outDataType = tfliteModel.outputs?.[0]?.dataType;
            const result = parseInferenceOutput(outputs, outDataType);

            if (developerDebugMode) {
              let outLength = 0;
              let outPreview = "";
              if (outputs && outputs[0]) {
                if (outputs[0].length !== undefined) {
                   outLength = outputs[0].length;
                   const first5Out = Array.from(outputs[0].slice(0, 5)).map((v: any) => v.toFixed(6));
                   outPreview = ` Preview: [${first5Out.join(', ')}...]`;
                } else if (outputs[0].byteLength) {
                   outLength = outDataType === 'float32' ? outputs[0].byteLength / 4 : outputs[0].byteLength;
                   const outArr = outDataType === 'float32' ? new Float32Array(outputs[0]) : new Uint8Array(outputs[0]);
                   const first5Out = Array.from(outArr.slice(0, 5)).map((v: any) => v.toFixed(6));
                   outPreview = ` Preview: [${first5Out.join(', ')}...]`;
                }
              }
              console.log(`[ML Debug] Output Tensor -> DataType: ${outDataType}, ArrayLength: ${outLength}.${outPreview}`);
            }

            const totalTime = Date.now() - startTime;
            const fps = Math.round(1000 / Math.max(1, totalTime));

            if (result) {
              const { maxIdx, maxVal, top3 } = result;
              const words = packWords[activePackId || '']?.map((w: any) => w.word) || [];
              
              // Chống tràn index nếu tflite model trả về kết quả ảo (out of bounds)
              const safeMaxIdx = (maxIdx >= 0 && maxIdx < words.length) ? maxIdx : -1;
              const maxWord = safeMaxIdx !== -1 ? words[safeMaxIdx] : 'Unknown';
              
              if (developerDebugMode && isMountedRef.current) {
                setMetrics({ preprocessTime, inferenceTime, totalTime, fps, top3 });
              }

              const top3Str = top3.map((t: {idx: number, val: number}) => {
                const word = (t.idx >= 0 && t.idx < words.length) ? words[t.idx] : 'Unknown';
                return `[${word} (Idx ${t.idx}): ${t.val.toFixed(3)}]`;
              }).join(', ');
              
              console.log(`[ML Debug] Model inference xong. Kết quả: ${maxWord} (Idx: ${safeMaxIdx}), maxVal: ${maxVal.toFixed(3)} | Time: ${totalTime}ms (Pre: ${preprocessTime}ms, Inf: ${inferenceTime}ms)`);
              console.log(`[ML Debug] Output Values (Top 3): ${top3Str}`);
              
              // Kiểm tra queue có bị clear ngang chừng không (chuyển mode)
              if (isMountedRef.current && processingItemRef.current === uri && safeMaxIdx !== -1) {
                onDetection(safeMaxIdx, maxVal);
              }
            }
          } catch (e: any) {
            const errMsg = e?.message || String(e);
            console.error("TFLite inference error:", errMsg);
            if (isMountedRef.current) {
              if (onError) onError(`Lỗi Model: ${errMsg}`);
              if (developerDebugMode) {
                Alert.alert(i18n.t('detection.mlInferenceError'), errMsg);
              }
            }
          } finally {
            if (developerDebugMode) {
              console.log(`[ML Debug] Hoàn thành trong ${Date.now() - startTime}ms. Queue length: ${frameQueue.current.length}`);
            }
            processingItemRef.current = null;
            isProcessingRef.current = false;
          }
        }
        
        // Polling interval
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    processLoop();

    return () => {
      isActive = false;
    };
  }, [tfliteModel, activePack, activePackId, customModelUri, developerDebugMode, onError, onDetection, packWords]);

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
    
    return { success: true, message: "Đã tiếp nhận và đưa ảnh vào hàng đợi!" };
  }, [developerDebugMode]);

  const getDebugInfo = useCallback(() => ({
    queueLength: frameQueue.current.length,
    isProcessing: isProcessingRef.current,
    processingItem: processingItemRef.current,
    queue: [...frameQueue.current],
    metrics
  }), [metrics]);

  const clearQueue = useCallback(() => {
    frameQueue.current = [];
    processingItemRef.current = null; // Huỷ cờ xử lý để chặn onDetection của frame hiện tại
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
    modelShape: tfliteModel?.inputs?.[0]?.shape,
    getDebugInfo,
    clearQueue
  };
}
