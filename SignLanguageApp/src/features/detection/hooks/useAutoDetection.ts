/**
 * useAutoDetection.ts
 * 
 * Auto Mode Hook - Quản lý toàn bộ logic tự động nhận diện bàn tay (Hand Detection)
 * và phân loại ký tự (Sign Language Classification) theo thời gian thực.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { useHandDetection } from './useHandDetection';

// Trạng thái máy trạng thái (State Machine)
const STATE_SEARCHING = 0; // Đang tìm bàn tay
const STATE_LOCKING = 1;   // Đã phát hiện bàn tay, đang chờ 3 giây

// Throttle frame processing (100ms = 10 FPS)
const FRAME_THROTTLE_MS = 100;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AutoDetectionResult {
  sign: string;
  confidence: number;
  id: string;
}

interface UseAutoDetectionOptions {
  isActive: boolean; // Auto mode đang bật
  cameraRef: React.RefObject<any>;
  facing: 'front' | 'back';
  handDetectionModel: any; // TFLite model cho hand detection (chưa dùng tới, đã bị thay bởi hook useHandDetection)
  runSignDetection: (uri: string, facing?: 'front' | 'back', bypassDuplicateCheck?: boolean) => any;
  activePackId: string | null;
  isModelReady: boolean;
  onAutoResult?: (result: AutoDetectionResult) => void;
  onStateChange?: (state: number) => void;
}

export function useAutoDetection({
  isActive,
  cameraRef,
  facing,
  runSignDetection,
  activePackId,
  isModelReady,
  onAutoResult,
  onStateChange,
}: UseAutoDetectionOptions) {
  // State Machine: 0 = Searching, 1 = Locking
  const [autoState, setAutoState] = useState<number>(STATE_SEARCHING);
  const autoStateRef = useRef<number>(STATE_SEARCHING);
  const [statusText, setStatusText] = useState<string>('Đang tìm bàn tay...');

  // Hook Hand Detection thực thụ
  const { detectHand, isHandModelReady } = useHandDetection();

  // Bounding Box Shared Values (cho Reanimated UI Thread)
  const boxX = useSharedValue(0);
  const boxY = useSharedValue(0);
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);
  const boxVisible = useSharedValue(0); // 0 = ẩn, 1 = hiện

  // Refs cho timing
  const handDetectionLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Kết quả auto detection
  const [autoResults, setAutoResults] = useState<AutoDetectionResult[]>([]);

  // Cập nhật ref khi state thay đổi
  useEffect(() => {
    autoStateRef.current = autoState;
    onStateChange?.(autoState);
  }, [autoState]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (handDetectionLoopRef.current) clearTimeout(handDetectionLoopRef.current);
    };
  }, []);

  /**
   * Chụp snapshot từ camera và trả về URI
   */
  const takeSnapshot = useCallback(async (): Promise<string | null> => {
    try {
      if (!cameraRef.current) return null;
      const photo = await cameraRef.current.takeSnapshot({ quality: 85 });
      let imagePath: string | undefined;

      if (photo && typeof photo.saveToTemporaryFileAsync === 'function') {
        imagePath = await photo.saveToTemporaryFileAsync('jpg', 85);
      } else {
        imagePath = photo?.path || (photo as any)?.uri || (typeof photo === 'string' ? photo : undefined);
      }

      if (imagePath && !imagePath.startsWith('file://') && !imagePath.startsWith('http') && imagePath.startsWith('/')) {
        imagePath = `file://${imagePath}`;
      }

      return imagePath || null;
    } catch (e) {
      console.warn('[Auto Mode] Snapshot error:', e);
      return null;
    }
  }, [cameraRef]);

  /**
   * Thực hiện quét: 
   * 1. Tìm tay
   * 2. Hiện Box
   * 3. Crop
   * 4. Gửi Sign Language Model
   */
  const performRecognition = useCallback(async () => {
    if (!isMountedRef.current || !isActive || !isModelReady || !activePackId || !isHandModelReady) return;

    try {
      const snapshotUri = await takeSnapshot();
      if (!snapshotUri) return;

      // BƯỚC 1: Đưa ảnh qua Hand Detection Model
      const handResult = await detectHand(snapshotUri, facing);

      if (handResult && handResult.detected && handResult.bbox) {
        // Đã tìm thấy tay! Liên tục bám sát và cập nhật UI.

        // BƯỚC 2: Tính toán Square Target Box (nhân 1.5 và thêm Fixed Padding)
        // Lấy kích thước ảnh gốc để quy đổi
        const imgInfo = await ImageManipulator.manipulateAsync(snapshotUri, []);
        const imgW = imgInfo.width;
        const imgH = imgInfo.height;

        const { x, y, width, height } = handResult.bbox; // Tỷ lệ [0..1]

        // Chuyển sang Pixel trên ảnh gốc
        const rawX = x * imgW;
        const rawY = y * imgH;
        const rawW = width * imgW;
        const rawH = height * imgH;

        // Tìm tâm bàn tay
        const centerX = rawX + rawW / 2;
        const centerY = rawY + rawH / 2;

        // Tính cạnh hình vuông: Max của rộng/cao * 1.5 + Fixed Padding
        // Fixed Padding = 40 logical pixels (quy đổi sang ảnh gốc)
        const UI_TO_IMG_RATIO = imgW / SCREEN_WIDTH;
        const FIXED_PADDING = 40 * UI_TO_IMG_RATIO;
        const side = Math.max(rawW, rawH) * 2.0 + FIXED_PADDING;

        // Cạnh góc trên bên trái mới (Hình vuông mở rộng)
        const newRawX = centerX - side / 2;
        const newRawY = centerY - side / 2;

        // Đổi ngược lại thành Ratios [0..1] để UI và Cropper dùng chung
        const finalRatioX = newRawX / imgW;
        const finalRatioY = newRawY / imgH;
        const finalRatioW = side / imgW;
        const finalRatioH = side / imgH;

        // BƯỚC 3: Cập nhật tọa độ cho UI (Khung xanh phát sáng)
        boxX.value = finalRatioX;
        boxY.value = finalRatioY;
        boxWidth.value = finalRatioW;
        boxHeight.value = finalRatioH;
        boxVisible.value = 1;

        // Đảm bảo toạ độ ratio không bị âm hoặc tràn màn hình (Clamp [0..1])
        const safeX = Math.max(0, Math.min(finalRatioX, 1));
        const safeY = Math.max(0, Math.min(finalRatioY, 1));
        const safeW = Math.max(0.01, Math.min(finalRatioW, 1 - safeX));
        const safeH = Math.max(0.01, Math.min(finalRatioH, 1 - safeY));

        // ImageManipulator yêu cầu số nguyên (integer) và toạ độ nằm hoàn toàn trong ảnh gốc
        const cropX = Math.floor(safeX * imgW);
        const cropY = Math.floor(safeY * imgH);
        let cropW = Math.floor(safeW * imgW);
        let cropH = Math.floor(safeH * imgH);

        // Fix rounding bounds
        if (cropX + cropW > imgW) cropW = imgW - cropX;
        if (cropY + cropH > imgH) cropH = imgH - cropY;

        const croppedImage = await ImageManipulator.manipulateAsync(
          snapshotUri,
          [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // BƯỚC 4: Đưa ảnh đã crop (chỉ chứa cái tay) vào mô hình Sign Language
        runSignDetection(croppedImage.uri, facing, true);

        // (Kết quả sẽ được gọi thông qua handleAutoDetectionResult bên dưới)
      } else {
        // Bàn tay đã rời khỏi khung hình
        if (boxVisible.value !== 0) {
          boxVisible.value = 0;
          setStatusText('Đang tìm bàn tay...');
        }
      }
    } catch (e) {
      console.warn('[Auto Mode] Recognition error:', e);
    }
  }, [isActive, isModelReady, activePackId, isHandModelReady, takeSnapshot, detectHand, runSignDetection, facing, boxX, boxY, boxWidth, boxHeight, boxVisible]);

  /**
   * Xử lý khi nhận được kết quả nhận diện (Sign Language).
   */
  const handleAutoDetectionResult = useCallback((sign: string, confidence: number) => {
    if (!isMountedRef.current || !isActive) return;

    // Vì hàm performRecognition đã chuyển state sang LOCKING rồi, 
    // chúng ta chỉ cần lưu kết quả và hẹn 3 giây để xóa

    const resultItem: AutoDetectionResult = {
      sign,
      confidence,
      id: `auto_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };

    setAutoResults(prev => {
      const newResults = [resultItem, ...prev];
      if (newResults.length > 50) newResults.length = 50;
      return newResults;
    });

    onAutoResult?.(resultItem);
    setStatusText(`Nhận diện: ${sign} (${Math.round(confidence * 100)}%)`);

    // Không cần dùng setTimeout 3 giây nữa, hệ thống sẽ liên tục quét.
    // Nếu khung hình tiếp theo mất dấu tay, performRecognition sẽ tự ẩn box.

  }, [isActive, onAutoResult]);

  /**
   * Vòng lặp chính của Auto Mode.
   */
  useEffect(() => {
    if (!isActive || !isModelReady || !activePackId) {
      // Reset khi tắt auto mode
      setAutoState(STATE_SEARCHING);
      setStatusText('Đang tìm bàn tay...');
      boxVisible.value = 0;
      setAutoResults([]);
      return;
    }

    let isLoopActive = true;

    const autoLoop = async () => {
      if (!isLoopActive || !isMountedRef.current) return;

      // Luôn luôn quét liên tục, không phụ thuộc vào trạng thái Locking nữa
      await performRecognition();

      // Tiếp tục loop
      if (isLoopActive && isMountedRef.current) {
        handDetectionLoopRef.current = setTimeout(autoLoop, FRAME_THROTTLE_MS);
      }
    };

    // Bắt đầu loop sau 500ms khởi động
    handDetectionLoopRef.current = setTimeout(autoLoop, 500);

    return () => {
      isLoopActive = false;
      if (handDetectionLoopRef.current) clearTimeout(handDetectionLoopRef.current);
    };
  }, [isActive, isModelReady, activePackId, performRecognition]);

  /**
   * Xóa tất cả kết quả auto detection
   */
  const clearAutoResults = useCallback(() => {
    setAutoResults([]);
  }, []);

  /**
   * Reset auto detection state
   */
  const resetAutoState = useCallback(() => {
    setAutoState(STATE_SEARCHING);
    setStatusText('Đang tìm bàn tay...');
    boxVisible.value = 0;
  }, [boxVisible]);

  return {
    // State
    autoState,
    statusText,
    autoResults,

    // Bounding box shared values (cho Reanimated)
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    boxVisible,

    // Actions
    handleAutoDetectionResult,
    clearAutoResults,
    resetAutoState,
    setAutoResults,

    // Constants
    STATE_SEARCHING,
    STATE_LOCKING,
  };
}
