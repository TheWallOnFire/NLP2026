import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert, Platform, InteractionManager } from 'react-native';
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
      
      // Fix Bug 39: Đảm bảo xóa sạch Model Shape cũ trước khi load cái mới
      if (isMounted) setTfliteModel(null);
      
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
            // LỖI NGHIÊM TRỌNG (Critical Bug): Tuyệt đối KHÔNG BẬT NNAPI trên Android.
            // Delegate NNAPI trên một số dòng máy (đặc biệt là thông qua JSI) gặp lỗi Memory Mapping,
            // dẫn đến việc Model không đọc được Buffer đầu vào và luôn trả về một mảng Output rác giống hệt nhau (M: 0.333).
            // Do đó, ta ép buộc chạy bằng CPU (truyền mảng rỗng []).
            m = await loadTensorflowModel({ url: urlToLoad }, []);
          } catch (e) {
            console.error("Lỗi khi load model trên Android:", e);
          }
        }
        if (isMounted) {
          // Fix Bug 35: Sấy Graph (Warm-up Phase). Chạy thử 1 vòng Tensor rỗng để Engine biên dịch C++
          if (m && m.inputs && m.inputs.length > 0) {
            try {
              const shape = m.inputs[0].shape;
              const size = shape.reduce((a: number, b: number) => a * b, 1);
              const dummy = m.inputs[0].dataType === 'float32' ? new Float32Array(size) : new Uint8Array(size);
              m.runSync([dummy.buffer]);
              console.log("[ML Debug] Warm-up inference hoàn tất!");
            } catch(warmupErr) { console.warn("Warm-up failed:", warmupErr); }
          }
          setTfliteModel(m);
        }
      } catch (cpuError: any) {
        console.error("Fast TFLite Load Error:", cpuError);
        if (isMounted) {
          setTfliteModel(null);
          if (urlToLoad === customModelUri) {
            Alert.alert(i18n.t('detection.modelLoadError'), i18n.t('detection.corruptedModel'));
          }
        }
      }
    };
    
    // Fix Bug 2 UI/UX: Đợi Animation trượt chuyển màn hình (Slide-in Navigation) hoàn tất rồi mới khóa JS Thread để Load Model, tránh bị khựng (Jitter)
    const task = InteractionManager.runAfterInteractions(() => {
       if (isMounted) loadModel();
    });
    
    return () => { 
      isMounted = false; 
      isMountedRef.current = false;
      task.cancel();
    };
  }, [customModelUri, activePackId]);

  useEffect(() => {
    return () => {
      if (tfliteModel && typeof tfliteModel.release === 'function') {
        try { tfliteModel.release(); } catch (e) {}
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
            console.log(`[SignLanguage] 1. Bắt đầu xử lý. Queue còn: ${frameQueue.current.length}`);
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
            
            // Fix Bug 23: Tự động phán đoán chuẩn hóa hoặc lấy cấu hình từ Pack
            let normalizationType: '[-1, 1]' | '[0, 1]' | '[0, 255]' = '[0, 1]';
            if (activePack?.normalization) {
               normalizationType = activePack.normalization;
            } else if (customModelUri && customModelUri.toLowerCase().includes('mobilenet')) {
               // Đa số MobileNetV2 gốc tải từ Keras sẽ dùng [-1, 1]
               normalizationType = '[-1, 1]';
            }
            
            const inputData = await convertPixelsToInputData(uint8Array, expectedElements, isRGBA, expectedChannels, dataType, pixelFormat, normalizationType);
            const preprocessTime = Date.now() - preStartTime;

            if (developerDebugMode) {
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i];
              
              const first5 = Array.from(inputData.slice(0, 5)).map(v => v.toFixed(6));
              const modelInfo = activePack ? `[${activePack.name} - v${activePack.version}]` : (customModelUri ? '[Custom Model]' : '[Unknown Model]');
              
              console.log(`[SignLanguage] 2. Bắt đầu Inference: ${modelInfo}`);
              console.log(`[SignLanguage] 3. Input Tensor -> Shape: ${JSON.stringify(shape)}, DataType: ${dataType}, Sum: ${sum.toFixed(4)}`);
              console.log(`[SignLanguage] 4. Input Preview: [${first5.join(', ')}...]`);
            }

            // Fix Bug 31: Nhường Event Loop cho React UI Thread render animation trước khi luồng JS bị khóa chết 300ms bởi runSync
            await new Promise(r => setTimeout(r, 0));
            
            // Truyền đúng chuẩn ArrayBuffer gốc (Không dùng .slice() vì sẽ sinh lỗi ép kiểu JSI)
            const infStartTime = Date.now();
            const outputs = tfliteModel.runSync([inputData.buffer]);
            const inferenceTime = Date.now() - infStartTime;
            
            const parseStartTime = Date.now();
            const outDataType = tfliteModel.outputs?.[0]?.dataType;
            const result = parseInferenceOutput(outputs, outDataType);
            const parseTime = Date.now() - parseStartTime;
            
            if (developerDebugMode) console.log(`[SignLanguage] 5. Profiler -> Inf: ${inferenceTime}ms, Parse: ${parseTime}ms`);

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
                   // Fix Bug 15: Kiểm tra tính toàn vẹn của mảng Byte trước khi ép kiểu Float32 (tránh lỗi RangeError làm sập App)
                   if (outDataType === 'float32' && outputs[0].byteLength % 4 !== 0) {
                      throw new Error(`Buffer rác: byteLength ${outputs[0].byteLength} không chia hết cho 4.`);
                   }
                   const outArr = outDataType === 'float32' ? new Float32Array(outputs[0]) : new Uint8Array(outputs[0]);
                   const first5Out = Array.from(outArr.slice(0, 5)).map((v: any) => v.toFixed(6));
                   outPreview = ` Preview: [${first5Out.join(', ')}...]`;
                }
              }
              console.log(`[SignLanguage] 6. Output Tensor -> DataType: ${outDataType}, Length: ${outLength}.${outPreview}`);
            }

            const totalTime = Date.now() - startTime;
            // Fix Bug 40: Bẫy nghịch đảo (Divide By Zero) gây FPS Ảo 1000. Cập nhật giới hạn tối đa 60 FPS
            const safeTime = totalTime > 0 ? totalTime : 1;
            const fps = Math.min(60, Math.round(1000 / safeTime));

            if (result) {
              const { maxIdx, maxVal, top3 } = result;
              const words = packWords[activePackId || '']?.map((w: any) => w.word) || [];
              
              // Chống tràn index và Fix Bug 69 (maxIdx === 0 bị bỏ qua)
              const safeMaxIdx = (maxIdx !== undefined && maxIdx >= 0 && maxIdx < words.length) ? maxIdx : -1;
              
              // Fix Bug 28: Từ chối kết quả rác nếu điểm dưới ngưỡng tối thiểu cực đoan (< 5%)
              const maxWord = (safeMaxIdx !== -1 && maxVal >= 0.05) ? words[safeMaxIdx] : 'Unknown';
              
              if (developerDebugMode && isMountedRef.current) {
                setMetrics({ preprocessTime, inferenceTime, totalTime, fps, top3 });
              }

              const top3Str = top3.map((t: {idx: number, val: number}) => {
                const word = (t.idx >= 0 && t.idx < words.length) ? words[t.idx] : 'Unknown';
                return `[${word} (Idx ${t.idx}): ${t.val.toFixed(3)}]`;
              }).join(', ');
              
              console.log(`[SignLanguage] 7. Result: ${maxWord} (Idx: ${safeMaxIdx}), Conf: ${maxVal.toFixed(3)} | Time: ${totalTime}ms`);
              console.log(`[SignLanguage] 8. Top 3: ${top3Str}`);
              
              // Kiểm tra queue có bị clear ngang chừng không (chuyển mode)
              if (isMountedRef.current && processingItemRef.current === uri) {
                if (safeMaxIdx !== -1) {
                  onDetection(safeMaxIdx, maxVal);
                } else if (onError) {
                  onError("Không thể nhận diện ký hiệu hợp lệ từ hình ảnh này.");
                }
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
              console.log(`[SignLanguage] 9. Hoàn thành xử lý trong ${Date.now() - startTime}ms.`);
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
      console.log(`[SignLanguage] 0. Nhận ảnh mới, đưa vào Queue (Tổng: ${frameQueue.current.length})`);
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
