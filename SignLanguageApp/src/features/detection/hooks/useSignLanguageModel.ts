import { useState, useEffect, useCallback } from 'react';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { useModelStore } from '../../learning/store/useModelStore';

export function useSignLanguageModel(
  onDetection: (index: number, confidence: number) => void
) {
  const { customModelUri } = useModelStore();
  const [tfliteModel, setTfliteModel] = useState<any>(null);

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

  const runDetection = useCallback((inputData?: Float32Array) => {
    if (!tfliteModel || !inputData) return;

    try {
      const outputs = tfliteModel.runSync([inputData]);
      if (outputs && outputs.length > 0) {
        const outputArray = outputs[0];

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
    }
  }, [tfliteModel, onDetection]);

  return { runDetection, isModelReady: tfliteModel != null };
}
