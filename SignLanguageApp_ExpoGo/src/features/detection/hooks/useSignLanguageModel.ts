import { useState, useEffect } from 'react';
import { useFrameOutput } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
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

  const handleDetectionJS = useRunOnJS((idx: number, conf: number) => {
    onDetection(idx, conf);
  }, [onDetection]);

  const frameOutput = useFrameOutput({
    targetResolution: { width: 224, height: 224 },
    pixelFormat: 'rgb',
    onFrame: (frame: any) => {
      'worklet';
      if (tfliteModel == null) {
        frame.dispose();
        return;
      }

      try {
        if (!frame.hasPixelBuffer) return;
        
        const buffer = frame.getPixelBuffer();
        const floatArray = new Float32Array(buffer); 

        const outputs = tfliteModel.runSync([floatArray]);
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
            handleDetectionJS(maxIdx, maxVal);
          }
        }
      } finally {
        frame.dispose();
      }
    }
  });

  return { frameOutput, isModelReady: tfliteModel != null };
}
