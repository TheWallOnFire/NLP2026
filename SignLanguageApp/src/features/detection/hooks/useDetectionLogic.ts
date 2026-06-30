import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { useVideoPlayer } from 'expo-video';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import { useDetectionUIState } from './useDetectionUIState';
import { useAutoDetection } from './useAutoDetection';

import { useSignLanguageModel } from './useSignLanguageModel';
import { triggerSelectionFeedback, triggerImpactFeedback } from '../../../utils/feedback';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useTheme } from 'react-native-paper';
import i18n from '../../../core/i18n';

const saveMediaToAppStorage = async (sourceUri: string): Promise<string> => {
  try {
    const mediaDir = `${FileSystem.cacheDirectory}captured_media/`;
    const dirInfo = await FileSystem.getInfoAsync(mediaDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
    }
    const cleanUri = sourceUri.split('?')[0];
    const ext = cleanUri.split('.').pop() || 'jpg';
    const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const destUri = `${mediaDir}${fileName}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch (error) {
    console.error("Failed to save media to app storage", error);
    return sourceUri;
  }
};

export function useDetectionLogic(navigation: any) {
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

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

  const isFocused = useIsFocused();

  // Fix Bug 40: Đồng bộ defaultFacing khi App focus
  useEffect(() => {
    if (isFocused) setFacing(defaultFacing);
  }, [defaultFacing, isFocused]);

  const saveCameraSession = useHistoryStore(state => state.saveCameraSession);
  const addImageVideoSession = useHistoryStore(state => state.addImageVideoSession);
  const addBatchSession = useHistoryStore(state => state.addBatchSession);
  const [sessionHistory, setSessionHistory] = useState<{ id: string, sign: string, conf?: number }[]>([]);
  const [pendingMediaUri, setPendingMediaUri] = useState<string | null>(null);

  const uiState = useDetectionUIState();
  const {
    isDebugDialogOpen, setIsDebugDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    isConfirmImageDialogOpen, setIsConfirmImageDialogOpen,
    imageToAnalyze, setImageToAnalyze,
    imageToAnalyzeSize, setImageToAnalyzeSize,
    detectionMode, setDetectionMode,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia,
    isProcessing, setIsProcessing,
    batchResults, setBatchResults,
    isBatchResultDialogOpen, setIsBatchResultDialogOpen,
    selectedBatchAssets, setSelectedBatchAssets,
    snackbarMsg, setSnackbarMsg,
    isUrlDialogOpen, setIsUrlDialogOpen,
    urlInput, setUrlInput,
    detectedWord, setDetectedWord,
    confidence, setConfidence
  } = uiState;


  const storagePermission = useSettingsStore(state => state.permissions?.storage ?? true);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const camera = useRef<any>(null);

  useEffect(() => setSessionHistory([]), [activePackId]);

  useEffect(() => {
    // Dọn dẹp bộ nhớ đệm (tránh tràn ổ cứng)
    const cleanCache = async () => {
      try {
        const mediaDir = `${FileSystem.cacheDirectory}captured_media/`;
        const dirInfo = await FileSystem.getInfoAsync(mediaDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(mediaDir, { idempotent: true });
        }
        // Xóa rác do ImageManipulator tạo ra (Bug 16)
        const manipDir = `${FileSystem.cacheDirectory}ImageManipulator/`;
        const manipInfo = await FileSystem.getInfoAsync(manipDir);
        if (manipInfo.exists) {
          await FileSystem.deleteAsync(manipDir, { idempotent: true });
        }
        // Xóa rác do takeSnapshot tạo ra
        const cameraDir = `${FileSystem.cacheDirectory}Camera/`;
        const cameraInfo = await FileSystem.getInfoAsync(cameraDir);
        if (cameraInfo.exists) {
          await FileSystem.deleteAsync(cameraDir, { idempotent: true });
        }
      } catch (e) {}
    };
    cleanCache(); // Clean on mount
    return () => { cleanCache(); }; // Clean on unmount
  }, []);

  const onSaveSession = (editedText: string, sessionId?: string | null) => {
    if (editedText.trim().length === 0) return;
    
    saveCameraSession(editedText, activePackId || undefined, sessionId);
    setSnackbarMsg(sessionId ? i18n.t('detection.savedToSession') : i18n.t('detection.newSessionCreated'));
  };

  const onSaveMediaSession = () => {
    if (sessionHistory.length > 0 && pendingMediaUri && detectionMode !== 'live') {
      const signsToSave = detectionMode === 'video' ? sessionHistory.map(h => h.sign).reverse() : [sessionHistory[0].sign];
      addImageVideoSession(detectionMode as 'picture' | 'video', pendingMediaUri, signsToSave, activePackId || undefined);
      setSnackbarMsg(i18n.t('detection.resultsSaved'));
      setSessionHistory([]);
      setPendingMediaUri(null);
    }
  };

  const lastDetectionTime = useRef(0);
  const latestDetectionRef = useRef<any>(null);
  const recentPredictions = useRef<string[]>([]);
  const lastSpeechTime = useRef(0);
  const lastSpokenWord = useRef<string | null>(null);
  const lastHapticTime = useRef(0); // Dùng để Fix Bug 42 (Rung Spam)
  // Fix Bug 1 UI/UX: Ref để kìm hãm luồng Render UI
  const lastUIUpdateTime = useRef(0);
  const lastRenderedWord = useRef<string | null>(null);
  const lastFrameProcessedTime = useRef(0);
  const lastLoggedWord = useRef<string | null>(null);
  // Auto Mode: Ref để chuyển tiếp kết quả detection sang auto handler
  const autoDetectionResultPendingRef = useRef<{ word: string; conf: number } | null>(null);

  const handleDetection = useCallback((index: number, conf: number) => {
    const words = packWords[activePackId || '']?.map(w => w.word) || [];
    if (words.length > 0 && index >= 0 && index < words.length) {
      const word = words[index];
      latestDetectionRef.current = { wordStr: word, conf };
      const now = Date.now();
      let timeSinceLast = now - lastDetectionTime.current;
      let frameGap = now - lastFrameProcessedTime.current;
      // Fix Bug 20 (Timezone Glitch): Chống âm thời gian nếu hệ điều hành cập nhật lại múi giờ hoặc DST
      if (timeSinceLast < 0) timeSinceLast = 1000;
      if (frameGap < 0) frameGap = 1000;
      
      // Fix Bug 1: Xóa lịch sử rác cũ nếu Camera bị tạm ngưng quá lâu, tránh ô nhiễm thuật toán Anti-Flicker
      if (frameGap > 1500) {
        recentPredictions.current = [];
      }
      lastFrameProcessedTime.current = now;

      const smoothedWord = word;

      // === AUTO MODE: Chuyển hướng kết quả sang Auto Detection Handler ===
      if (detectionMode === 'auto' && isLiveScanning) {
        if (isMounted.current) {
          setDetectedWord(smoothedWord);
          setConfidence(conf);
        }
        autoDetectionResultPendingRef.current = { word: smoothedWord, conf };
        return;
      }

      if (isMounted.current) {
        const shouldUpdateUI = 
          smoothedWord !== lastRenderedWord.current || 
          (now - lastUIUpdateTime.current > 200) || 
          detectionMode === 'picture' || 
          detectionMode === 'batch';
          
        if (shouldUpdateUI) {
          setDetectedWord(smoothedWord);
          setConfidence(conf);
          lastRenderedWord.current = smoothedWord;
          lastUIUpdateTime.current = now;
        }
      }

      if (detectionMode === 'picture') {
        if (isMounted.current) {
          const uniqueId = `${now}_${Math.random().toString(36).substring(7)}`;
          setSessionHistory([{ id: uniqueId, sign: smoothedWord, conf: conf }]); 
          setIsHistoryDialogOpen(true);
          setIsProcessing(false);
        }
      } else {
        if (isMounted.current) {
          setSessionHistory(prev => {
            const uniqueId = `${now}_${Math.random().toString(36).substring(7)}`;
            const newHistory = [{ id: uniqueId, sign: smoothedWord, conf: conf }, ...prev];
            if (newHistory.length > 50) newHistory.length = 50;
            return newHistory;
          });
        }
      }

      lastDetectionTime.current = now;
      lastLoggedWord.current = smoothedWord;

      if (conf >= thresholdValue) {
        if (now - lastHapticTime.current > 800) {
          setTimeout(() => triggerImpactFeedback(), 0);
          lastHapticTime.current = now;
        }
        
        if (ttsSettings?.systemSounds !== false && smoothedWord && smoothedWord.trim() !== '' && (now - lastSpeechTime.current > 1500) && (lastSpokenWord.current !== smoothedWord)) {
          setTimeout(() => {
            try {
              Speech.stop();
              Speech.speak(smoothedWord, { language: ttsSettings?.ttsLanguage || 'en-US', rate: ttsSettings?.voiceRate || 0.9 });
            } catch (e) { console.warn("Speech API failed", e); }
          }, 0);
          lastSpeechTime.current = now;
          lastSpokenWord.current = smoothedWord;
        }
      }
    } else if (index !== undefined) {
      console.warn(`Model trả về index [${index}] vượt quá mảng từ vựng (Bug 10). Vui lòng cập nhật bộ từ!`);
    }
  }, [activePackId, packWords, ttsSettings, thresholdValue, detectionMode, isLiveScanning]);

  const handleModelError = useCallback((errorMsg: string) => {
    setSnackbarMsg(errorMsg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
    setIsProcessing(false); // Fix Bug: Nhả khóa màn hình nếu Model gặp lỗi
  }, []);

  const { isModelReady, boxedModel, modelShape, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, handleModelError);
  const [debugData, setDebugData] = useState<any>(null);

  // === AUTO MODE INTEGRATION ===
  const isAutoModeActive = detectionMode === 'auto' && isLiveScanning;
  
  const autoDetection = useAutoDetection({
    isActive: isAutoModeActive,
    cameraRef: camera,
    facing,
    runSignDetection: runDetection,
    activePackId,
    isModelReady,
    onAutoResult: (result) => {
      if (isMounted.current) {
        // Lưu kết quả auto detection vào sessionHistory
        setSessionHistory(prev => {
          const newItem = { id: result.id, sign: result.sign, conf: result.confidence };
          const newHistory = [newItem, ...prev];
          if (newHistory.length > 50) newHistory.length = 50;
          return newHistory;
        });
      }
    }
  });

  const appState = useRef(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setIsAppActive(nextAppState === 'active');
      if (nextAppState !== 'active' && clearQueue) {
        // Bug 5: Xóa rỗng hàng đợi khi thu nhỏ App xuống Background để tránh quét ảnh cũ khi mở lại
        clearQueue();
      }
      appState.current = nextAppState;
    });
    
    // Bug 11: Tự động dọn dẹp rác (Cache Bloat) của ImageManipulator khi Component Mount
    const cleanImageCache = async () => {
      try {
        const cacheDir = FileSystem.cacheDirectory + 'ImageManipulator';
        const info = await FileSystem.getInfoAsync(cacheDir);
        if (info.exists) {
          await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        }
      } catch (e) { }
    };
    cleanImageCache();

    return () => subscription.remove();
  }, [clearQueue]);

  // Đã dọn dẹp các UseSharedValue gây Anti-pattern và Memory Leak dư thừa

  const frameOutput = useFrameOutput({
    onFrame: (frame) => {
      'worklet';
      // Mọi xử lý live giờ được chuyển về handleManualScan + runDetection queue
      // Worklet này chỉ giữ chỗ để tránh crash
      frame.dispose();
    }
  });

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
  // camera ref đã được khai báo ở trên (trước useAutoDetection)

  useEffect(() => {
    navigation.setOptions({ autoHideHomeIndicator: true, headerShown: false });
  }, [navigation]);

  const scannerState = useRef({ hasPermission, activePackId, detectionMode, isLiveScanning });
  scannerState.current = { hasPermission, activePackId, detectionMode, isLiveScanning };

  const pickBatchImages = async () => {
    try {
      if (Platform.OS === 'android') {
        const { StorageAccessFramework } = FileSystem;
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const uri = permissions.directoryUri;
          const allImageUris: string[] = [];
          
          const scanDirectory = async (dirUri: string) => {
            try {
              const files = await StorageAccessFramework.readDirectoryAsync(dirUri);
              for (const fileUri of files) {
                const extMatch = fileUri.match(/\.([a-zA-Z0-9]+)$/);
                if (extMatch) {
                  const ext = extMatch[1].toLowerCase();
                  if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext)) {
                    allImageUris.push(fileUri);
                  }
                } else {
                  // Fix (Anti-pattern): Bỏ try-catch kiểm tra thư mục. Không quét đệ quy rủi ro.
                  // Ta chỉ chấp nhận file định dạng rõ ràng, bỏ qua các URL không có đuôi.
                }
              }
            } catch (e: any) {
              console.warn(`Không thể truy cập thư mục: ${dirUri}`, e);
            }
          };

          setSnackbarMsg(i18n.t('detection.scanningFolder'));
          await scanDirectory(uri);
          
          if (allImageUris.length > 0) {
            const assets = allImageUris.map(imgUri => ({
              uri: imgUri,
              name: imgUri.split('%2F').pop() || 'image.jpg'
            }));
            
            setSelectedBatchAssets(assets);
            setSelectedMedia(assets[0].uri);
          } else {
            Alert.alert(i18n.t('detection.error'), i18n.t('detection.noImagesFound'));
          }
        }
      } else {
        // Fallback for iOS
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: 50, // Tránh OOM khi chọn quá nhiều ảnh (Bug 43)
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setSelectedBatchAssets(result.assets);
          setSelectedMedia(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.warn("Failed to pick batch directory", error);
    }
  };

  const handleBatchScan = async () => {
    if (!selectedBatchAssets || selectedBatchAssets.length === 0) {
      setSnackbarMsg(i18n.t('detection.noFilesSelected'));
      return;
    }
    setIsProcessing(true);
    setSnackbarMsg(i18n.t('detection.preparingImages'));
    setBatchResults([]);

    try {
      const results: {fileName: string, sign: string, conf: number}[] = [];
      
      for (let i = 0; i < selectedBatchAssets.length; i++) {
        // Fix Bug 9 (Batch Interleaving): Dừng vòng lặp ngay lập tức nếu người dùng thoát Component
        if (!isMounted.current) break;
        
        // Fix Bug 4 UI/UX: Đổi setTimeout(0) thành setTimeout(16) (Tương đương 1 Frame 60FPS) để ép JS Thread nhả Event Loop cho UI Thread render Snackbar
        await new Promise(resolve => setTimeout(resolve, 16));
        
        const asset = selectedBatchAssets[i];
        setSnackbarMsg(`${i18n.t('detection.processing')} ${i + 1}/${selectedBatchAssets.length}...`);
        
        const fileName = asset.name || `image_${i}.jpg`;
        
        // Cần lưu File Content URI vào local Cache (file://) để thuật toán Image Resize xử lý được
        let destUri = asset.uri;
        if (destUri.startsWith('content://')) {
           destUri = await saveMediaToAppStorage(destUri);
        }

        latestDetectionRef.current = null; // Reset kết quả ảnh cũ
        if (clearQueue) clearQueue();
        
        // Không truyền facing cho ảnh Batch để tránh bị lật ngang sai logic
        runDetection(destUri, undefined, true);
        
        let attempts = 0;
        // Fix: Tăng khoảng thời gian chờ để nhả Event Loop cho UI
        while ((getDebugInfo().isProcessing || getDebugInfo().queueLength > 0) && attempts < 250) {
          await new Promise(r => setTimeout(r, 200));
          attempts++;
        }
        
        if (attempts >= 500) {
          console.warn(`[Batch Scan] Timeout xử lý ảnh ${fileName}`);
          latestDetectionRef.current = null;
        }

        await new Promise(r => setTimeout(r, 100));
        
        if (latestDetectionRef.current) {
          results.push({
            fileName: fileName,
            sign: latestDetectionRef.current.wordStr || 'Unknown',
            conf: latestDetectionRef.current.conf
          });
        } else {
          results.push({ fileName, sign: 'Lỗi', conf: 0 });
        }
      }

      setBatchResults(results);
      if (results.length > 0) {
        addBatchSession(results, activePackId || undefined);
      }
      setIsBatchResultDialogOpen(true);
      setSnackbarMsg(i18n.t('detection.batchComplete'));
      
    } catch (e: any) {
      console.error("Batch scan error:", e);
      setSnackbarMsg(i18n.t('detection.processingError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualScan = async (overrideUri?: string | null, isManualClick: boolean = false) => {
    if (!isAppActive) return;
    if (detectionMode === 'batch') {
      if (isManualClick) await handleBatchScan();
      return;
    }
    if (!activePackId) {
      if (isManualClick) Alert.alert(i18n.t('detection.error'), i18n.t('detection.selectModelFirst'));
      return;
    }
    if (!isModelReady) {
      if (isManualClick) Alert.alert(i18n.t('detection.modelNotReady'), i18n.t('detection.modelNotReady'));
      return;
    }
    setIsProcessing(true);
    triggerImpactFeedback();

    const actualMedia = typeof overrideUri === 'string' ? overrideUri : selectedMedia;
    let result: { success: boolean, message: string } | undefined;

    try {
      if (detectionMode === 'live' || detectionMode === 'auto') {
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
              if (developerDebugMode) setSnackbarMsg(i18n.t('detection.autoSnapshot'));
              result = runDetection(imagePath, facing, true);
            } else {
              result = { success: false, message: i18n.t('detection.cameraError') };
            }
          } catch (cameraError: any) {
            result = { success: false, message: `${i18n.t('detection.snapshotError')}: ${cameraError.message || cameraError}` };
          }
        }
      } else if (actualMedia && detectionMode === 'picture') {
        let finalMedia = actualMedia;
        if (finalMedia && !finalMedia.startsWith('file://') && !finalMedia.startsWith('http') && finalMedia.startsWith('/')) {
          finalMedia = `file://${finalMedia}`;
        }
        
        // Lấy thông tin file ảnh để hiện trên Dialog
        try {
          const Image = require('react-native').Image;
          const fileInfo = await FileSystem.getInfoAsync(finalMedia);
          const bytes = fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size || 0 : 0;
          Image.getSize(finalMedia, (width: number, height: number) => {
            setImageToAnalyzeSize({ width, height, bytes });
            setImageToAnalyze(finalMedia);
            setIsConfirmImageDialogOpen(true);
          }, () => {
            setImageToAnalyzeSize({ width: 0, height: 0, bytes });
            setImageToAnalyze(finalMedia);
            setIsConfirmImageDialogOpen(true);
          });
        } catch (e) {
          setImageToAnalyze(finalMedia);
          setIsConfirmImageDialogOpen(true);
        }
        return;
      } else if (actualMedia && detectionMode === 'video') {
        try {
          // Fix Bug 28 & 22: Chống nội suy (Motion Blur) giữa các Frame bằng cách làm tròn cứng thời gian
          const timeToCapture = Math.floor(player.currentTime * 1000);
          const { uri } = await VideoThumbnails.getThumbnailAsync(actualMedia, { time: timeToCapture, quality: 0.8 });
          let finalMedia = uri;
          if (finalMedia && !finalMedia.startsWith('file://') && !finalMedia.startsWith('http') && finalMedia.startsWith('/')) {
            finalMedia = `file://${finalMedia}`;
          }
          setPendingMediaUri(actualMedia);
          result = runDetection(finalMedia, undefined);
        } catch (thumbErr: any) {
          result = { success: false, message: i18n.t('detection.thumbnailError') + ": " + thumbErr.message };
        }
      } else {
        result = { success: false, message: i18n.t('detection.noMediaSelected') };
      }

      if (isManualClick && result) {
        if (result.success) setSnackbarMsg(result.message);
        else Alert.alert(i18n.t('detection.denied'), result.message);
      }
    } catch (e: any) {
      if (isManualClick) Alert.alert(i18n.t('detection.scanError'), e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    let timerId: NodeJS.Timeout;

    if (hasPermission && activePackId && (detectionMode === 'live' || detectionMode === 'video') && isLiveScanning) {
      cancelAnimation(scanAnimValue); // Fix Bug 38: Xóa hàng đợi Worklet trước khi gán mới
      scanAnimValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );

      const loop = async () => {
        if (!isActive) return;
        const state = scannerState.current;
        if (!state.isLiveScanning || !state.hasPermission) return;
        
        if ((state.detectionMode === 'video' || state.detectionMode === 'live') && !isProcessing) {
          await handleManualScan();
        }
        
        if (isActive) timerId = setTimeout(loop, 1000);
      };

      if (detectionMode === 'video' || detectionMode === 'live') {
        timerId = setTimeout(loop, 500);
      }
    } else {
      cancelAnimation(scanAnimValue);
      setDetectedWord(null);
      setConfidence(0);
    }
    
    // Bug 10: Xóa Ghost Detection mỗi khi người dùng đổi chế độ (VD Live sang Video)
    return () => {
      isActive = false;
      clearTimeout(timerId);
      setDetectedWord(null);
      setConfidence(0);
    };
  }, [hasPermission, activePackId, detectionMode, isModelReady, isAppActive, isLiveScanning]);

  useEffect(() => {
    if (!isDebugDialogOpen && !developerDebugMode) return;
    if (getDebugInfo) setDebugData(getDebugInfo());
    const interval = setInterval(() => {
      if (getDebugInfo) setDebugData(getDebugInfo());
    }, 200);
    return () => clearInterval(interval);
  }, [isDebugDialogOpen, developerDebugMode, getDebugInfo]);

  const onPressManualScan = async () => {
    if (detectionMode === 'auto') {
      setIsLiveScanning(prev => !prev);
      return;
    }
    
    if (detectionMode === 'live' || detectionMode === 'video') {
      if (detectionMode === 'video' && !selectedMedia) {
        Alert.alert(i18n.t('detection.error'), i18n.t('detection.selectVideoFirst'));
        return;
      }
      if (detectionMode === 'video' && !isLiveScanning) {
        Alert.alert(
        i18n.t('detection.confirmVideoAnalysis'),
        i18n.t('detection.confirmVideoAnalysisDesc'),
        [
            { text: i18n.t('common.cancel'), style: "cancel" },
            { text: i18n.t('common.start'), onPress: () => setIsLiveScanning(true) }
          ]
        );
        return;
      }
      setIsLiveScanning(prev => !prev);
    } else {
      await handleManualScan(null, true);
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
    let destUriTemp = '';
    try {
      setIsProcessing(true);
      let cleanUrl = url.trim();
      
      // Fix Bug 84: Chặn HTTP kém bảo mật (Cleartext) và thay bằng HTTPS
      if (cleanUrl.startsWith('http://')) {
        cleanUrl = cleanUrl.replace('http://', 'https://');
      }

      try { new URL(cleanUrl); } catch (e) { throw new Error(i18n.t('detection.invalidUrl')); }
      setSnackbarMsg(i18n.t('detection.checkingNetwork'));
      
      // Fix Bug 23: Sử dụng API chuẩn để bóc tách đuôi file, tránh bị nhiễu bởi Query Parameters (?id=...)
      const parsedUrl = new URL(cleanUrl);
      const rawExt = parsedUrl.pathname.split('.').pop() || 'jpg';
      const safeExt = /^[a-zA-Z]{2,4}$/.test(rawExt) ? rawExt.toLowerCase() : 'jpg';
      const fileName = `dl_img_${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;
      const destUri = `${FileSystem.cacheDirectory}${fileName}`;
      destUriTemp = destUri;

      try {
        const fileInfo = await FileSystem.getInfoAsync(destUri);
        if (fileInfo.exists) await FileSystem.deleteAsync(destUri, { idempotent: true });
      } catch (e) { }
      setSnackbarMsg(i18n.t('detection.downloading'));

      const downloadWithRetry = async (url: string, dest: string, retries = 2, timeoutMs = 15000): Promise<any> => {
        for (let i = 0; i <= retries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const downloadPromise = FileSystem.downloadAsync(url, dest);
            let innerTimeoutId: any;
            const timeoutPromise = new Promise((_, reject) => {
               innerTimeoutId = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
            });
            const result = await Promise.race([downloadPromise, timeoutPromise]) as FileSystem.FileSystemDownloadResult;
            clearTimeout(timeoutId);
            clearTimeout(innerTimeoutId); // Fix Bug 6: Hủy bộ đếm giờ ngầm để tránh Unhandled Promise Rejection
            if (result.status === 200) return result;
            if (result.status === 206) throw new Error(i18n.t('detection.partialContentError')); // Fix Bug 24
            if (i === retries) throw new Error(`${i18n.t('detection.statusError')}: ${result.status}`);
          } catch (error) {
            if (i === retries) throw error;
          }
        }
      };

      const { uri, headers } = await downloadWithRetry(cleanUrl, destUri);
      const downloadedType = headers['content-type'] || headers['Content-Type'];
      if (downloadedType && !downloadedType.toLowerCase().includes('image/')) throw new Error(i18n.t('detection.formatError'));

      if (appState.current !== 'active') return;
      setSelectedMedia(uri);
      setIsLiveScanning(false);
      setUrlInput("");
      setIsUrlDialogOpen(false);
      setSnackbarMsg(i18n.t('detection.downloadSuccess'));
      await handleManualScan(uri, true);
    } catch (err: any) {
      // Fix Bug 19: Dọn rác tệp tin tải dang dở khi có lỗi Timeout/Mạng
      if (destUriTemp) {
        try { await FileSystem.deleteAsync(destUriTemp, { idempotent: true }); } catch (e) {}
      }
      console.warn("Lỗi chọn ảnh:", err);
      // Fix Bug 48: Ép kiểu lỗi thành chuỗi an toàn
      Alert.alert(i18n.t('detection.imageLoadError'), String(err.message || err || i18n.t('detection.imageLoadError')));
    } finally {
      setIsProcessing(false);
    }
  };

  const pickModelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessing(true); // Fix Bug 50: Hiển thị trạng thái Loading
        try {
          const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
           if (fileInfo.exists && fileInfo.size && fileInfo.size > 200 * 1024 * 1024) {
             return Alert.alert(i18n.t('detection.fileTooLarge'), i18n.t('detection.fileTooLargeDesc'));
           }
           
           if (!result.assets[0].name?.toLowerCase().endsWith('.tflite')) {
             return Alert.alert(i18n.t('detection.securityError'), i18n.t('detection.invalidTflite'));
           }

          const targetPath = `${FileSystem.documentDirectory}${result.assets[0].name}`;
          await FileSystem.copyAsync({ from: result.assets[0].uri, to: targetPath });
          setCustomModelUri(targetPath);
          Alert.alert(i18n.t('detection.success'), i18n.t('detection.customModelSuccess'));
        } catch (err: any) {
          Alert.alert(i18n.t('detection.invalidFile'), String(err.message || err || i18n.t('detection.invalidTflite')));
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (err: any) { 
      Alert.alert(i18n.t('detection.modelLoadError'), String(err.message || err)); // Fix Bug 48: Ép kiểu string chống văng Object
    }
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

  const handleDetectionModeChange = (mode: 'live' | 'picture' | 'video' | 'batch' | 'auto') => {
    clearQueue();
    // Fix Bug 31: Xóa bóng ma State (Stale Closure) khi đổi Mode
    recentPredictions.current = [];
    setDetectedWord(null);
    setConfidence(0);
    setDetectionMode(mode);
    // Reset Auto Mode state khi chuyển mode
    if (mode !== 'auto') {
      autoDetection.resetAutoState();
    }
  };

  // === AUTO MODE: Xử lý kết quả detection pending ===
  useEffect(() => {
    if (!isAutoModeActive) return;
    
    const checkPending = setInterval(() => {
      const pending = autoDetectionResultPendingRef.current;
      if (pending) {
        autoDetectionResultPendingRef.current = null;
        autoDetection.handleAutoDetectionResult(pending.word, pending.conf);
      }
    }, 50);
    
    return () => clearInterval(checkPending);
  }, [isAutoModeActive, autoDetection.handleAutoDetectionResult]);

  // Auto Mode: Lưu kết quả vào history
  const onSaveAutoSession = useCallback(() => {
    if (sessionHistory.length > 0) {
      const text = sessionHistory.map(h => h.sign).reverse().join(' ');
      saveCameraSession(text, activePackId || undefined);
      setSnackbarMsg(i18n.t('detection.autoResultsSaved'));
      setSessionHistory([]);
      autoDetection.clearAutoResults();
    }
  }, [sessionHistory, activePackId, saveCameraSession, autoDetection.clearAutoResults]);

  return {
    theme, developerDebugMode, facing, flash, hasPermission, requestPermission, device,
    activePackId, activePack, setActivePack, customModelUri, setCustomModelUri, downloadedPacks,
    sessionHistory, setSessionHistory, onSaveSession, onSaveMediaSession, onSaveAutoSession,
    debugData, isDebugDialogOpen, setIsDebugDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    isConfirmImageDialogOpen, setIsConfirmImageDialogOpen,
    imageToAnalyze, imageToAnalyzeSize,
    confirmImageAnalysis: () => {
      setIsConfirmImageDialogOpen(false);
      if (imageToAnalyze) {
        setPendingMediaUri(imageToAnalyze);
        setIsProcessing(true); // Fix Bug: Khóa chạm màn hình để chờ AI xử lý
        runDetection(imageToAnalyze, undefined);
      }
    },
    detectedWord, confidence, updateSettings,
    detectionMode, setDetectionMode: handleDetectionModeChange,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia, selectedBatchAssets,
    isProcessing, snackbarMsg, setSnackbarMsg,
    frameOutput, isUrlDialogOpen, setIsUrlDialogOpen, urlInput, setUrlInput,
    player, scanAnimStyle, camera, isAppActive, isFocused,
    onPressManualScan, pickImage, pickVideo, pickBatchImages, handleUrlImage, pickModelFile,
    toggleCameraFacing, toggleFlash, clearQueue, packWords, modelShape,
    batchResults, isBatchResultDialogOpen, setIsBatchResultDialogOpen,
    // Auto Mode exports
    autoDetection,
    isAutoModeActive,
  };
}
