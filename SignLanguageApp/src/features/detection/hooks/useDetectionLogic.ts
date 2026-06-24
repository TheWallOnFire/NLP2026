import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { useCameraDevice, useCameraPermission, useFrameOutput, useAsyncRunner } from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer } from 'expo-video';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';

import { useSignLanguageModel } from './useSignLanguageModel';
import { triggerSelectionFeedback, triggerImpactFeedback } from '../../../utils/feedback';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useTheme } from 'react-native-paper';

const saveMediaToAppStorage = async (sourceUri: string): Promise<string> => {
  try {
    const mediaDir = `${FileSystem.cacheDirectory}captured_media/`;
    const dirInfo = await FileSystem.getInfoAsync(mediaDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
    }
    const cleanUri = sourceUri.split('?')[0];
    const ext = cleanUri.split('.').pop() || 'jpg';
    const fileName = `media_${Date.now()}.${ext}`;
    const destUri = `${mediaDir}${fileName}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch (error) {
    console.error("Failed to save media to app storage", error);
    return sourceUri;
  }
};

export function useDetectionLogic(navigation: any) {
  const theme = useTheme();
  const defaultFacing = useSettingsStore(state => state.camera?.defaultFacing || 'back');
  const ttsSettings = useSettingsStore(state => state.sound);
  const developerDebugMode = useSettingsStore(state => state.developerDebugMode);

  const [facing, setFacing] = useState<'back' | 'front'>(defaultFacing);
  const [flash, setFlash] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(facing);

  const { packs, activePackId, setActivePack, customModelUri, setCustomModelUri } = useModelStore();
  const packWords = useLearningStore(state => state.packWords);
  const thresholdValue = useSettingsStore(state => state.detection?.threshold || 0.5);
  const downloadedPacks = packs.filter(p => p.isDownloaded);
  const activePack = downloadedPacks.find(p => p.id === activePackId);

  const addManualDetectionSession = useHistoryStore(state => state.addManualDetectionSession);
  const [sessionHistory, setSessionHistory] = useState<{ id: string, sign: string }[]>([]);

  useEffect(() => setSessionHistory([]), [activePackId]);

  const onSaveSession = (editedText: string) => {
    if (editedText.trim().length > 0) {
      addManualDetectionSession(editedText, activePackId || 'unknown', detectionMode);
    }
  };

  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const lastDetectionTime = useRef(0);

  const handleDetection = useCallback((index: number, conf: number) => {
    if (Date.now() - lastDetectionTime.current > 1000) {
      const words = packWords[activePackId || '']?.map(w => w.word) || [];
      if (words.length > 0 && index >= 0 && index < words.length) {
        const word = words[index];
        setDetectedWord(word);
        setConfidence(conf);
        lastDetectionTime.current = Date.now();

        if (conf >= thresholdValue) {
          triggerImpactFeedback();
          if (ttsSettings?.systemSounds !== false && word && word.trim() !== '') {
            try {
              Speech.stop();
              Speech.speak(word, { language: ttsSettings?.ttsLanguage || 'en-US', rate: ttsSettings?.voiceRate || 0.9 });
            } catch (e) { console.warn("Speech API failed", e); }
          }
          setSessionHistory(prev => [{ id: Date.now().toString(), sign: word }, ...prev]);
        }
      }
    }
  }, [activePackId, packWords, ttsSettings, thresholdValue]);

  const [snackbarMsg, setSnackbarMsg] = useState("");
  const handleModelError = useCallback((errorMsg: string) => {
    setSnackbarMsg(errorMsg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
  }, []);

  const { isModelReady, boxedModel, modelShape, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, handleModelError);
  const [debugData, setDebugData] = useState<any>(null);

  const appState = useRef(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');
  const isFocused = useIsFocused();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setIsAppActive(nextAppState === 'active');
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const detectionSpeed = useSettingsStore(state => state.detection?.speed || 'normal');
  const storagePermission = useSettingsStore(state => state.permissions?.storage ?? true);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const [detectionMode, setDetectionMode] = useState<'live' | 'picture' | 'video'>('live');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const modelWidth = modelShape && modelShape.length >= 3 ? (modelShape[1] > 10 ? modelShape[1] : modelShape[2]) : 224;
  const modelHeight = modelShape && modelShape.length >= 3 ? (modelShape[2] > 10 ? modelShape[2] : (modelShape[1] > 10 ? modelShape[1] : 224)) : 224;

  const { resizer } = useResizer({
    width: modelWidth,
    height: modelHeight,
    channelOrder: 'rgb',
    dataType: 'uint8',
    scaleMode: 'cover',
    pixelLayout: 'interleaved',
  });

  const lastProcessTime = useSharedValue(0);
  const lastDetectTimeSV = useSharedValue(0);
  const isLiveScanningSV = useSharedValue(false);
  const isAppActiveSV = useSharedValue(true);
  const facingSV = useSharedValue(facing);
  const detectedIdxSV = useSharedValue(-1);
  const detectedValSV = useSharedValue(0);
  const detectionTriggerSV = useSharedValue(0);
  const errorMsgSV = useSharedValue('');
  const errorTriggerSV = useSharedValue(0);

  useAnimatedReaction(
    () => detectionTriggerSV.value,
    (currentTrigger, previousTrigger) => {
      if (currentTrigger !== previousTrigger && currentTrigger > 0) {
        runOnJS(handleDetection)(detectedIdxSV.value, detectedValSV.value);
      }
    }
  );

  useAnimatedReaction(
    () => errorTriggerSV.value,
    (currentTrigger, previousTrigger) => {
      if (currentTrigger !== previousTrigger && currentTrigger > 0) {
        runOnJS(handleModelError)(errorMsgSV.value);
      }
    }
  );

  useEffect(() => { isLiveScanningSV.value = isLiveScanning; }, [isLiveScanning]);
  useEffect(() => { isAppActiveSV.value = isAppActive; }, [isAppActive]);
  useEffect(() => { facingSV.value = facing; }, [facing]);

  const currentInterval = detectionSpeed === 'slow' ? 2000 : detectionSpeed === 'fast' ? 500 : detectionSpeed === 'off' ? -1 : 1000;
  const asyncRunner = useAsyncRunner();

  const frameOutput = useFrameOutput({
    onFrame: (frame) => {
      'worklet';
      if (!isLiveScanningSV.value || !isAppActiveSV.value || currentInterval === -1 || detectionMode === 'live') {
        frame.dispose();
        return;
      }
      const now = Date.now();
      if (now - lastDetectTimeSV.value < 1000) {
        frame.dispose();
        return;
      }
      if (now - lastProcessTime.value < currentInterval) {
        frame.dispose();
        return;
      }
      lastProcessTime.value = now;

      const wasHandled = asyncRunner.runAsync(() => {
        'worklet';
        try {
          if (!boxedModel || !resizer) return;
          const tflite = boxedModel.unbox();
          let resized: any = null;
          try {
            resized = resizer.resize(frame);
            const rawBuffer = resized.getPixelBuffer();
            const inputDataType = tflite.inputs[0].dataType;
            let inputBuffer: ArrayBuffer;
            const uint8 = new Uint8Array((rawBuffer as any).buffer || rawBuffer);
            const isFront = facingSV.value === 'front';

            if (inputDataType === 'float32') {
              const float32 = new Float32Array(uint8.length);
              for (let y = 0; y < modelHeight; y++) {
                for (let x = 0; x < modelWidth; x++) {
                  const srcX = isFront ? (modelWidth - 1 - x) : x;
                  const srcIdx = (y * modelWidth + srcX) * 3;
                  const dstIdx = (y * modelWidth + x) * 3;
                  float32[dstIdx] = Math.fround(uint8[srcIdx] / 255.0);
                  float32[dstIdx + 1] = Math.fround(uint8[srcIdx + 1] / 255.0);
                  float32[dstIdx + 2] = Math.fround(uint8[srcIdx + 2] / 255.0);
                }
              }
              inputBuffer = float32.buffer;
            } else {
              const int8Out = new Uint8Array(uint8.length);
              for (let y = 0; y < modelHeight; y++) {
                for (let x = 0; x < modelWidth; x++) {
                  const srcX = isFront ? (modelWidth - 1 - x) : x;
                  const srcIdx = (y * modelWidth + srcX) * 3;
                  const dstIdx = (y * modelWidth + x) * 3;
                  int8Out[dstIdx] = uint8[srcIdx];
                  int8Out[dstIdx + 1] = uint8[srcIdx + 1];
                  int8Out[dstIdx + 2] = uint8[srcIdx + 2];
                }
              }
              inputBuffer = int8Out.buffer;
            }

            const outputs = tflite.runSync([inputBuffer]);
            const rawOut = outputs[0] as any;
            const outputData = Array.isArray(rawOut) ? rawOut.flat(Infinity) : rawOut;

            let outputArray = outputData;
            if (outputData && outputData.byteLength && !outputData.length) {
              outputArray = new Float32Array(outputData);
            }
            if (outputArray && outputArray.length > 0) {
              let maxIdx = 0;
              let maxVal = outputArray[0];
              for (let i = 1; i < outputArray.length; i++) {
                if (outputArray[i] > maxVal) {
                  maxVal = outputArray[i];
                  maxIdx = i;
                }
              }
              if (isNaN(maxVal)) {
                errorMsgSV.value = "Lỗi: Kết quả model trả về NaN.";
                errorTriggerSV.value = now;
              } else if (maxVal > thresholdValue && maxVal > 0 && isFinite(maxVal)) {
                lastDetectTimeSV.value = now;
                detectedIdxSV.value = maxIdx;
                detectedValSV.value = maxVal;
                detectionTriggerSV.value = now;
              }
            }
          } finally {
            if (resized) resized.dispose();
          }
        } catch (e: any) {
          errorMsgSV.value = `Lỗi Camera Worklet: ${e.message || 'Unknown'}`;
          errorTriggerSV.value = Date.now();
        } finally {
          frame.dispose();
        }
      });
      if (!wasHandled) frame.dispose();
    }
  });

  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const player = useVideoPlayer(detectionMode === 'video' ? selectedMedia : null, player => {
    if (player) {
      player.loop = true;
      player.play();
    }
  });

  useEffect(() => {
    if (!isAppActive) {
      if (player && player.playing) player.pause();
      if (clearQueue) clearQueue();
    }
  }, [isAppActive, player, clearQueue]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (flash) timeout = setTimeout(() => setFlash(false), 180000);
    return () => clearTimeout(timeout);
  }, [flash]);

  const scanAnimValue = useSharedValue(0);
  const scanAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanAnimValue.value * 200 }]
  }));
  const camera = useRef<any>(null);

  useEffect(() => {
    navigation.setOptions({ autoHideHomeIndicator: true, headerShown: false });
  }, [navigation]);

  const getInterval = () => {
    switch (detectionSpeed) {
      case 'slow': return 2000;
      case 'normal': return 1000;
      case 'fast': return 500;
      case 'off': return -1;
      default: return 1000;
    }
  };

  const scannerState = useRef({ hasPermission, detectionSpeed, activePackId, detectionMode, isLiveScanning });
  scannerState.current = { hasPermission, detectionSpeed, activePackId, detectionMode, isLiveScanning };

  const handleManualScan = async (overrideUri?: string | null, isManualClick: boolean = false) => {
    if (!activePackId) {
      if (isManualClick) Alert.alert("Lỗi", "Vui lòng chọn bộ từ vựng (Model) trước.");
      return;
    }
    if (!isModelReady) {
      if (isManualClick) Alert.alert("Chưa sẵn sàng", "Model chưa được tải xong, vui lòng đợi thêm chút...");
      return;
    }
    setIsProcessing(true);
    triggerImpactFeedback();

    const actualMedia = typeof overrideUri === 'string' ? overrideUri : selectedMedia;
    let result: { success: boolean, message: string } | undefined;

    try {
      if (detectionMode === 'live') {
        if (camera.current && (isManualClick || isLiveScanning)) {
          try {
            const photo = await camera.current.takeSnapshot({ quality: 85 });
            let imagePath: string | undefined = undefined;
            if (photo && typeof photo.saveToTemporaryFileAsync === 'function') {
              imagePath = await photo.saveToTemporaryFileAsync('jpg', 85);
            } else {
              imagePath = photo?.path || (photo as any)?.uri || (typeof photo === 'string' ? photo : undefined);
            }
            if (imagePath && !imagePath.startsWith('file://') && !imagePath.startsWith('http') && imagePath.startsWith('/')) {
              imagePath = `file://${imagePath}`;
            }
            if (imagePath) {
              if (developerDebugMode) setSnackbarMsg("Đã tự động chụp và xử lý...");
              result = runDetection(imagePath, facing, true);
            } else {
              result = { success: false, message: "Lỗi Camera: Không thể lưu file ảnh tạm." };
            }
          } catch (cameraError: any) {
            result = { success: false, message: `Lỗi chụp ảnh: ${cameraError.message || cameraError}` };
          }
        }
      } else if (actualMedia && detectionMode === 'picture') {
        let finalMedia = actualMedia;
        if (finalMedia && !finalMedia.startsWith('file://') && !finalMedia.startsWith('http') && finalMedia.startsWith('/')) {
          finalMedia = `file://${finalMedia}`;
        }
        result = runDetection(finalMedia, undefined);
      } else if (actualMedia && detectionMode === 'video') {
        try {
          const timeToCapture = player.currentTime * 1000;
          const { uri } = await VideoThumbnails.getThumbnailAsync(actualMedia, { time: timeToCapture, quality: 0.8 });
          let finalMedia = uri;
          if (finalMedia && !finalMedia.startsWith('file://') && !finalMedia.startsWith('http') && finalMedia.startsWith('/')) {
            finalMedia = `file://${finalMedia}`;
          }
          result = runDetection(finalMedia, undefined);
        } catch (thumbErr: any) {
          result = { success: false, message: "Không thể trích xuất khung hình từ video: " + thumbErr.message };
        }
      } else {
        result = { success: false, message: "Chưa có file ảnh/video nào được chọn." };
      }

      if (isManualClick && result) {
        if (result.success) setSnackbarMsg(result.message);
        else Alert.alert("Từ chối", result.message);
      }
    } catch (e: any) {
      if (isManualClick) Alert.alert("Lỗi quá trình quét", e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    let timerId: NodeJS.Timeout;

    if (hasPermission && detectionSpeed !== 'off' && activePackId && (detectionMode === 'live' || detectionMode === 'video') && isLiveScanning) {
      scanAnimValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: getInterval() === -1 ? 1000 : getInterval() }),
          withTiming(0, { duration: getInterval() === -1 ? 1000 : getInterval() })
        ),
        -1,
        false
      );

      const loop = async () => {
        if (!isActive) return;
        const state = scannerState.current;
        if (!state.isLiveScanning || state.detectionSpeed === 'off' || !state.hasPermission) return;
        await handleManualScan();
        if (isActive) timerId = setTimeout(loop, getInterval());
      };

      if (detectionMode === 'video' || detectionMode === 'live') {
        timerId = setTimeout(loop, detectionMode === 'live' ? getInterval() : 500);
      }
    } else {
      cancelAnimation(scanAnimValue);
      setDetectedWord(null);
      setConfidence(0);
    }
    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [hasPermission, activePackId, detectionMode, isModelReady, isAppActive, isLiveScanning, detectionSpeed]);

  useEffect(() => {
    if (!isDebugDialogOpen && !developerDebugMode) return;
    if (getDebugInfo) setDebugData(getDebugInfo());
    const interval = setInterval(() => {
      if (getDebugInfo) setDebugData(getDebugInfo());
    }, 200);
    return () => clearInterval(interval);
  }, [isDebugDialogOpen, developerDebugMode, getDebugInfo]);

  const onPressManualScan = async () => {
    if ((detectionMode === 'live' || detectionMode === 'video') && detectionSpeed !== 'off') {
      if (detectionMode === 'video' && !selectedMedia) {
        Alert.alert("Lỗi", "Vui lòng chọn video trước khi quét.");
        return;
      }
      if (detectionMode === 'video' && !isLiveScanning) {
        Alert.alert(
          "Xác nhận phân tích Video",
          "Hệ thống sẽ trích xuất khung hình từ video để nhận dạng.\nThời gian xử lý: ~500ms - 2s.\nBạn có muốn bắt đầu không?",
          [
            { text: "Hủy", style: "cancel" },
            { text: "Bắt đầu", onPress: () => setIsLiveScanning(true) }
          ]
        );
        return;
      }
      setIsLiveScanning(prev => !prev);
    } else {
      if (detectionMode === 'picture' && selectedMedia) {
        Alert.alert(
          "Xác nhận phân tích Ảnh",
          "Hình ảnh đã được chọn.\nKích thước chuẩn: 224x224 RGB.\nThời gian xử lý: ~500ms - 2s.\nBạn có muốn phân tích không?",
          [
            { text: "Hủy", style: "cancel" },
            { text: "Nhận dạng", onPress: () => handleManualScan(null, true) }
          ]
        );
      } else {
        await handleManualScan(null, true);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const savedUri = storagePermission ? await saveMediaToAppStorage(uri) : uri;
      setSelectedMedia(savedUri);
      setDetectionMode('picture');
      setIsLiveScanning(false);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const savedUri = storagePermission ? await saveMediaToAppStorage(uri) : uri;
      setSelectedMedia(savedUri);
      setDetectionMode('video');
      setIsLiveScanning(false);
    }
  };

  const handleUrlImage = async (url: string) => {
    if (!url) return;
    try {
      setIsProcessing(true);
      const cleanUrl = url.trim();
      try { new URL(cleanUrl); } catch (e) { throw new Error("Đường dẫn URL không hợp lệ."); }
      setSnackbarMsg("Đang kiểm tra kết nối mạng và ảnh...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(cleanUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Server từ chối truy cập.`);
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) throw new Error("Không phải file ảnh.");
      } catch (e: any) {
        if (e.name === 'AbortError') throw new Error("Mạng quá yếu.");
        if (e.message.includes("Server từ chối") || e.message.includes("Không phải file ảnh")) throw e;
      }
      const ext = cleanUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `downloaded_image_temp.${ext}`;
      const destUri = `${FileSystem.cacheDirectory}${fileName}`;
      try {
        const fileInfo = await FileSystem.getInfoAsync(destUri);
        if (fileInfo.exists) await FileSystem.deleteAsync(destUri, { idempotent: true });
      } catch (e) { }
      setSnackbarMsg("Đang tải ảnh...");

      const downloadWithRetry = async (url: string, dest: string, retries = 2, timeoutMs = 15000): Promise<any> => {
        for (let i = 0; i <= retries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const downloadPromise = FileSystem.downloadAsync(url, dest);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs));
            const result = await Promise.race([downloadPromise, timeoutPromise]) as FileSystem.FileSystemDownloadResult;
            clearTimeout(timeoutId);
            if (result.status === 200) return result;
            if (i === retries) throw new Error(`Lỗi: ${result.status}`);
          } catch (error) {
            if (i === retries) throw error;
          }
        }
      };

      const { uri, headers } = await downloadWithRetry(cleanUrl, destUri);
      const downloadedType = headers['content-type'] || headers['Content-Type'];
      if (downloadedType && !downloadedType.toLowerCase().includes('image/')) throw new Error("Lỗi định dạng.");

      if (appState.current !== 'active') return;
      setSelectedMedia(uri);
      setIsLiveScanning(false);
      setUrlInput("");
      setIsUrlDialogOpen(false);
      setSnackbarMsg("Tải thành công! Bắt đầu quét...");
      await handleManualScan(uri, true);
    } catch (err: any) {
      Alert.alert("Lỗi tải ảnh", err.message || "Không thể tải ảnh.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pickModelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        if (fileName.includes('..') || fileName.includes('/')) return Alert.alert("Security Error", "Invalid file name.");
        if (fileName.endsWith('.tflite')) {
          setCustomModelUri(fileUri);
          Alert.alert("Success", "Custom TFLite model loaded successfully!");
        } else {
          Alert.alert("Invalid File", "Please select a valid .tflite model file.");
        }
      }
    } catch (err) { console.error("Failed to pick model", err); }
  };

  const toggleCameraFacing = () => {
    triggerSelectionFeedback();
    setFacing(current => {
      const nextFacing = current === 'back' ? 'front' : 'back';
      if (nextFacing === 'front') setFlash(false);
      return nextFacing;
    });
  };

  const toggleFlash = () => {
    if (facing === 'front') return;
    triggerSelectionFeedback();
    setFlash(!flash);
  };

  const handleDetectionModeChange = (mode: 'live' | 'picture' | 'video') => {
    clearQueue();
    setDetectionMode(mode);
  };

  return {
    theme, developerDebugMode, facing, flash, hasPermission, requestPermission, device,
    activePackId, activePack, setActivePack, customModelUri, setCustomModelUri, downloadedPacks,
    sessionHistory, setSessionHistory, onSaveSession,
    debugData, isDebugDialogOpen, setIsDebugDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    detectedWord, confidence, detectionSpeed, updateSettings,
    detectionMode, setDetectionMode: handleDetectionModeChange,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia,
    isProcessing, snackbarMsg, setSnackbarMsg,
    frameOutput, isUrlDialogOpen, setIsUrlDialogOpen, urlInput, setUrlInput,
    player, scanAnimStyle, camera, isAppActive, isFocused,
    onPressManualScan, pickImage, pickVideo, handleUrlImage, pickModelFile,
    toggleCameraFacing, toggleFlash, clearQueue, packWords, modelWidth
  };
}
