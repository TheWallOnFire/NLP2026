import { useState, useEffect, useMemo, useRef } from 'react';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { NitroModules } from 'react-native-nitro-modules';

export function useHandDetectionModel() {
  const [tfliteModel, setTfliteModel] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let isMounted = true;
    
    const loadModel = async () => {
      try {
        // Sử dụng require để nhúng trực tiếp model từ thư mục assets
        // File palm_detection_lite.tflite có input shape [1, 192, 192, 3] và đầu ra là tensor phân loại (classificators) và bounding box (regressors)
        const modelAsset = require('../../../../assets/palm_detection_lite.tflite');
        const m = await loadTensorflowModel(modelAsset, []);
        
        if (isMounted && m) {
          console.log("[HandDetector] Model loaded successfully");
          setTfliteModel(m);
          setIsReady(true);
        }
      } catch (error) {
        console.error("[HandDetector] Failed to load hand detection model:", error);
      }
    };

    loadModel();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      if (tfliteModel && typeof tfliteModel.release === 'function') {
        try { tfliteModel.release(); } catch (e) {}
      }
    };
  }, []);

  const boxedHandModel = useMemo(() => {
    if (tfliteModel && typeof tfliteModel.runSync === 'function') {
      return NitroModules.box(tfliteModel);
    }
    return undefined;
  }, [tfliteModel]);

  return {
    isHandModelReady: isReady,
    boxedHandModel
  };
}
