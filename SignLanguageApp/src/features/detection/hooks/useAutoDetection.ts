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
import { trackWithCamShift, resetCamShiftTracker } from '../utils/camShiftTracker';



// Throttle frame processing (100ms = 10 FPS)
const FRAME_THROTTLE_MS = 100;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AutoDetectionResult {
  sign: string;
  confidence: number;
  id: string;
}

interface UseAutoDetectionOptions {
  isActive: boolean; 
  cameraRef: React.RefObject<any>;
  facing: 'front' | 'back';
  runSignDetection: (uri: string, facing?: 'front' | 'back', bypassDuplicateCheck?: boolean) => any;
  activePackId: string | null;
  isModelReady: boolean;
  onAutoResult?: (result: AutoDetectionResult) => void;
}

enum TrackingState {
  SEARCHING = 0,
  TRACKING = 1
}

export function useAutoDetection({
  isActive,
  cameraRef,
  facing,
  runSignDetection,
  activePackId,
  isModelReady,
  onAutoResult,
}: UseAutoDetectionOptions) {
  const [statusText, setStatusText] = useState<string>('Đang tìm bàn tay...');
  
  // State Machine
  const trackingState = useRef<TrackingState>(TrackingState.SEARCHING);
  const missedFramesCount = useRef<number>(0);
  
  // Ref lưu trạng thái tọa độ Pixel thực (dành cho CamShift)
  const currentBoxRef = useRef<{x: number, y: number, w: number, h: number} | null>(null);

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
   * LUỒNG 1 (TRACKING LOOP): 
   * 1. Tìm tay
   * 2. Tính toán Box
   * 3. Bơm lên UI (Không cắt ảnh, không gọi AI chữ)
   */
  const performTracking = useCallback(async () => {
    if (!isMountedRef.current || !isActive || !isModelReady || !activePackId || !isHandModelReady) return;

    try {
      const snapshotUri = await takeSnapshot();
      if (!snapshotUri) return;

      const imgInfo = await ImageManipulator.manipulateAsync(snapshotUri, []);
      const imgW = imgInfo.width;
      const imgH = imgInfo.height;

      // NẾU ĐANG TÌM KIẾM (SEARCHING) -> DÙNG AI (MediaPipe)
      if (trackingState.current === TrackingState.SEARCHING) {
        const handResult = await detectHand(snapshotUri, facing);

        if (handResult && handResult.detected && handResult.bbox) {
          const { x, y, width, height } = handResult.bbox; 
          const rawX = x * imgW;
          const rawY = y * imgH;
          const rawW = width * imgW;
          const rawH = height * imgH;

          const centerX = rawX + rawW / 2;
          const centerY = rawY + rawH / 2;

          const UI_TO_IMG_RATIO = imgW / SCREEN_WIDTH;
          const FIXED_PADDING = 40 * UI_TO_IMG_RATIO;
          let side = Math.max(rawW, rawH) * 1.5 + FIXED_PADDING;
          side = Math.min(side, Math.min(imgW, imgH));

          let newRawX = centerX - side / 2;
          let newRawY = centerY - side / 2;

          if (newRawX < 0) newRawX = 0;
          if (newRawY < 0) newRawY = 0;
          if (newRawX + side > imgW) newRawX = imgW - side;
          if (newRawY + side > imgH) newRawY = imgH - side;

          // Lưu tọa độ thật để CamShift nối tiếp
          currentBoxRef.current = { x: newRawX, y: newRawY, w: side, h: side };

          const finalRatioX = newRawX / imgW;
          const finalRatioY = newRawY / imgH;
          const finalRatioW = side / imgW;
          const finalRatioH = side / imgH;

          boxX.value = finalRatioX;
          boxY.value = finalRatioY;
          boxWidth.value = finalRatioW;
          boxHeight.value = finalRatioH;
          boxVisible.value = 1;

          trackingState.current = TrackingState.TRACKING;
          setStatusText('Đã khóa mục tiêu (CamShift)...');
          missedFramesCount.current = 0;
        }
      } 
      // NẾU ĐÃ KHÓA (TRACKING) -> DÙNG CAMSHIFT (Thuật toán truyền thống, không dùng AI)
      else if (trackingState.current === TrackingState.TRACKING && currentBoxRef.current) {
        const newBox = await trackWithCamShift(snapshotUri, currentBoxRef.current, imgW, imgH);
        
        if (newBox) {
          currentBoxRef.current = newBox;
          
          boxX.value = newBox.x / imgW;
          boxY.value = newBox.y / imgH;
          boxWidth.value = newBox.w / imgW;
          boxHeight.value = newBox.h / imgH;
          boxVisible.value = 1;
          
          missedFramesCount.current = 0;
        } else {
           missedFramesCount.current += 1;
           if (missedFramesCount.current >= 3) {
             trackingState.current = TrackingState.SEARCHING;
             currentBoxRef.current = null;
             resetCamShiftTracker();
             if (boxVisible.value !== 0) boxVisible.value = 0;
             setStatusText('Đang tìm bàn tay...');
           }
        }
      }
    } catch (e) {
      console.warn('[Auto Mode] Tracking error:', e);
    }
  }, [isActive, isModelReady, activePackId, isHandModelReady, takeSnapshot, detectHand, facing, boxX, boxY, boxWidth, boxHeight, boxVisible]);

  /**
   * LUỒNG 2 (RECOGNITION LOOP):
   * Chỉ chạy khi đã TRACKING. Lấy tọa độ cắt ảnh gửi qua AI
   */
  const performSignRecognition = useCallback(async () => {
    if (!isMountedRef.current || !isActive || trackingState.current !== TrackingState.TRACKING) return;

    try {
      const snapshotUri = await takeSnapshot();
      if (!snapshotUri) return;

      const imgInfo = await ImageManipulator.manipulateAsync(snapshotUri, []);
      const imgW = imgInfo.width;
      const imgH = imgInfo.height;

      // Lấy tọa độ Box hiện tại từ UI Thread
      let safeX = boxX.value;
      let safeY = boxY.value;
      let safeSide = boxWidth.value;

      // Đảm bảo không bị văng do sai số Float
      const cropX = Math.max(0, Math.floor(safeX * imgW));
      const cropY = Math.max(0, Math.floor(safeY * imgH));
      const cropSide = Math.min(Math.floor(safeSide * imgW), Math.min(imgW - cropX, imgH - cropY));

      const croppedImage = await ImageManipulator.manipulateAsync(
        snapshotUri,
        [
          { crop: { originX: cropX, originY: cropY, width: cropSide, height: cropSide } },
          { resize: { width: 224, height: 224 } } 
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      runSignDetection(croppedImage.uri, facing, true);
    } catch (e) {
      console.warn('[Auto Mode] Sign Recognition error:', e);
    }
  }, [isActive, takeSnapshot, runSignDetection, facing, boxX, boxY, boxWidth]);

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
   * Khởi chạy Đa Luồng (Multi-threading Loops)
   */
  useEffect(() => {
    if (!isActive || !isModelReady || !activePackId) {
      setStatusText('Đang tìm bàn tay...');
      trackingState.current = TrackingState.SEARCHING;
      missedFramesCount.current = 0;
      currentBoxRef.current = null;
      boxVisible.value = 0;
      setAutoResults([]);
      return;
    }

    let isTrackingLoopActive = true;
    let isRecognitionLoopActive = true;

    // Luồng 1: Chạy tốc độ cao (10 FPS)
    const trackingLoop = async () => {
      if (!isTrackingLoopActive || !isMountedRef.current) return;
      await performTracking();
      if (isTrackingLoopActive && isMountedRef.current) {
        handDetectionLoopRef.current = setTimeout(trackingLoop, 100);
      }
    };

    // Luồng 2: Chạy nhẩn nha (3 FPS)
    const recognitionLoop = async () => {
      if (!isRecognitionLoopActive || !isMountedRef.current) return;
      await performSignRecognition();
      if (isRecognitionLoopActive && isMountedRef.current) {
        setTimeout(recognitionLoop, 300); // Poll mỗi 300ms
      }
    };

    // Khởi động 2 luồng độc lập
    handDetectionLoopRef.current = setTimeout(trackingLoop, 500);
    setTimeout(recognitionLoop, 800);

    return () => {
      isTrackingLoopActive = false;
      isRecognitionLoopActive = false;
      if (handDetectionLoopRef.current) clearTimeout(handDetectionLoopRef.current);
    };
  }, [isActive, isModelReady, activePackId, performTracking, performSignRecognition]);

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
      setStatusText('Đang tìm bàn tay...');
      trackingState.current = TrackingState.SEARCHING;
      missedFramesCount.current = 0;
      currentBoxRef.current = null;
      boxVisible.value = 0;
  }, [boxVisible]);

  return {
    // State
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
  };
}
