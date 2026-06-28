import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { prepareImageForModel, convertPixelsToInputData } from '../utils/imageProcessor';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// MediaPipe Palm Detection (Full) Constants
const INPUT_SIZE = 192;
const THRESHOLD = 0.4; // Ngưỡng confidence (sau khi qua hàm Sigmoid)

// Bộ tạo Anchors (Neo) cho MediaPipe Palm Detection 192x192
// Tổng số anchors = 2016
// Gồm 2 layer feature map: 
// 1. 24x24 (stride 8) x 2 anchors/ô = 1152
// 2. 12x12 (stride 16) x 6 anchors/ô = 864
// Tổng: 1152 + 864 = 2016 anchors.
const generateAnchors = () => {
  const anchors = [];
  // Layer 1 (24x24)
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const cx = (x + 0.5) / 24.0;
      const cy = (y + 0.5) / 24.0;
      anchors.push({ x: cx, y: cy });
      anchors.push({ x: cx, y: cy });
    }
  }
  // Layer 2 (12x12)
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const cx = (x + 0.5) / 12.0;
      const cy = (y + 0.5) / 12.0;
      for (let a = 0; a < 6; a++) {
        anchors.push({ x: cx, y: cy });
      }
    }
  }
  return anchors;
};

const PALM_ANCHORS = generateAnchors();

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function useHandDetection() {
  const [model, setModel] = useState<any>(null);
  const isMounted = useRef(true);
  const isProcessing = useRef(false);
  const wasHandDetected = useRef(false); // Lưu trạng thái track tay trước đó

  // Khởi tạo model khi mount
  useEffect(() => {
    isMounted.current = true;
    const loadModel = async () => {
      try {
        // Dùng expo-asset để tự động copy file model từ bundle vào bộ nhớ thiết bị
        const [asset] = await Asset.loadAsync(require('../../../../assets/models/palm_detection.tflite'));
        const modelPath = asset.localUri || asset.uri;
        
        const m = await loadTensorflowModel({ url: modelPath }, []);
        if (isMounted.current) {
          setModel(m);
          console.log("[Hand Detection] Đã load thành công Palm Detection Model!");
        }
      } catch (e) {
        console.warn("[Hand Detection] Lỗi load model (Có thể file chưa được copy vào DocumentDirectory):", e);
      }
    };
    
    loadModel();
    return () => {
      isMounted.current = false;
      if (model && typeof model.release === 'function') {
        try { model.release(); } catch(e){}
      }
    };
  }, []);

  /**
   * Chạy model phát hiện bàn tay trên ảnh snapshot.
   */
  const detectHand = useCallback(async (imageUri: string, facing: 'front' | 'back' = 'back') => {
    if (!model || isProcessing.current) return null;
    isProcessing.current = true;

    try {
      // BƯỚC QUAN TRỌNG ĐỂ SỬA LỖI KHUNG Ở GIỮA VÀ BỊ MẤT TAY Ở GÓC:
      // prepareImageForModel mặc định sẽ "Center Crop" ảnh thành hình vuông, làm mất vùng tay ở rìa màn hình.
      // Giải pháp: Ép (Squash) toàn bộ ảnh chữ nhật thành hình vuông 192x192 trước, 
      // để model có thể nhìn thấy toàn bộ màn hình camera.
      const squashResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
      );

      // Chuẩn bị ảnh: Đưa ảnh đã squash vào buffer
      const shape = [1, INPUT_SIZE, INPUT_SIZE, 3];
      const { uint8Array, expectedElements, isRGBA, expectedChannels, pixelFormat } = await prepareImageForModel(squashResult.uri, shape, facing);
      
      // Palm Detection Model Google thường dùng Normalization [0, 1] hoặc [-1, 1].
      // Đã đổi sang [0, 1] để kiểm tra xem logit có về bình thường không.
      const inputData = await convertPixelsToInputData(
        uint8Array, expectedElements, isRGBA, expectedChannels, 'float32', pixelFormat, '[0, 1]'
      );

      // Chạy Inference (C++ Đồng bộ)
      await new Promise(r => setTimeout(r, 0)); // Tránh khóa UI Thread
      // Trả lại inputData.buffer vì Nitro C++ yêu cầu chính xác ArrayBuffer gốc
      const outputs = model.runSync([inputData.buffer]);
      
      // MediaPipe trả về 2 Tensor. Tùy phiên bản mà index 0 hoặc 1 là Regressor hoặc Classifier.
      // Cần check kỹ byteLength hoặc length của từng output.
      // console.log(`[Hand Detection] Tensors: ${outputs.length}`);
      // Các phần tử trong mảng outputs thường là các TypedArray view trỏ chung vào 1 ArrayBuffer khổng lồ.
      // Do đó, nếu gọi `new Float32Array(outputs[0].buffer)` mà không truyền offset, ta sẽ đọc từ đầu buffer
      // dẫn đến việc đọc nhầm Regressors thành Classifiers (MaxLogit ra 920, Fake Detection).
      const getFloat32 = (view: any) => {
        if (view instanceof Float32Array) return view;
        // Nếu Nitro trả về thẳng ArrayBuffer (constructor = ArrayBuffer)
        if (view instanceof ArrayBuffer) return new Float32Array(view);
        // Nếu là TypedArray khác (Uint8Array, ...)
        return new Float32Array(view.buffer || view, view.byteOffset || 0, (view.byteLength || 0) / 4);
      };

      let regressorsBuf, classifiersBuf;
      if (outputs[0].byteLength > outputs[1].byteLength) {
        regressorsBuf = getFloat32(outputs[0]);
        classifiersBuf = getFloat32(outputs[1]);
      } else {
        regressorsBuf = getFloat32(outputs[1]);
        classifiersBuf = getFloat32(outputs[0]);
      }

      // BƯỚC GIẢI MÃ (DECODE) ---
      let maxLogit = -Infinity;
      let maxIndex = -1;

      // Tìm anchor có Logit (độ tin cậy) cao nhất
      for (let i = 0; i < 2016; i++) {
        const logit = classifiersBuf[i];
        if (logit > maxLogit) {
          maxLogit = logit;
          maxIndex = i;
        }
      }

      // Fix Lỗi Fake Detection:
      const isPreActivated = maxLogit >= 0 && maxLogit <= 1.0;
      const maxConfidence = isPreActivated ? maxLogit : sigmoid(maxLogit);

      // Tăng ngưỡng nhận diện lên 0.65 để chặn Bóng ma.
      // Tuy nhiên, áp dụng Hysteresis Threshold: Nếu khung trước đã có tay, giảm ngưỡng xuống 0.2 
      // để tiếp tục bám theo kể cả khi người dùng nắm tay lại (làm giảm Confidence).
      const DYNAMIC_THRESHOLD = wasHandDetected.current ? 0.2 : 0.65;

      if (maxConfidence > DYNAMIC_THRESHOLD && maxIndex !== -1) {
        // Có bàn tay! Cập nhật trạng thái đang track
        wasHandDetected.current = true;
        console.log(`[Hand] Detected! Conf: ${maxConfidence.toFixed(2)} (Thresh: ${DYNAMIC_THRESHOLD})`);

        // Cấu trúc mảng Regressors tại index i: [dx, dy, w, h, (14 thông số cho 7 keypoints)]
        const rOffset = maxIndex * 18;
        const dx = regressorsBuf[rOffset];
        const dy = regressorsBuf[rOffset + 1];
        const w = regressorsBuf[rOffset + 2];
        const h = regressorsBuf[rOffset + 3];

        const anchor = PALM_ANCHORS[maxIndex];

        // Công thức giải mã Bounding Box của MediaPipe:
        // center_x = dx / INPUT_SIZE + anchor.x
        // center_y = dy / INPUT_SIZE + anchor.y
        const centerX = (dx / INPUT_SIZE) + anchor.x;
        const centerY = (dy / INPUT_SIZE) + anchor.y;
        
        const boxWidth = w / INPUT_SIZE;
        const boxHeight = h / INPUT_SIZE;

        // Vì ta đã SQUASH ảnh (resize không crop), tọa độ [0..1] của TFLite (centerX, centerY) 
        // chính là tọa độ chuẩn hóa (Normalized Ratios) của toàn bộ khung Camera.
        // Ta trả về trực tiếp Ratios [0..1] thay vì nhân với SCREEN_WIDTH/HEIGHT
        // để Component UI tự động scale theo kích thước thực tế của View (Camera Container).
        const finalX = centerX - boxWidth / 2;
        const finalY = centerY - boxHeight / 2;
        const finalW = boxWidth;
        const finalH = boxHeight;

        return {
          detected: true,
          confidence: maxConfidence,
          bbox: {
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH
          }
        };
      }
      
      wasHandDetected.current = false;
      return { detected: false };
    } catch (e) {
      console.warn("[Hand Detection] Inference Error:", e);
      return { detected: false };
    } finally {
      isProcessing.current = false;
    }
  }, [model]);

  return { detectHand, isHandModelReady: model != null };
}
