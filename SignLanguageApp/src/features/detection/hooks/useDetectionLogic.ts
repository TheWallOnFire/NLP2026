import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { useCameraDevice, useCameraPermission, useFrameOutput, useAsyncRunner } from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
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
  const [sessionHistory, setSessionHistory] = useState<{ id: string, sign: string }[]>([]);
  const [pendingMediaUri, setPendingMediaUri] = useState<string | null>(null);

  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isConfirmImageDialogOpen, setIsConfirmImageDialogOpen] = useState(false);
  const [imageToAnalyze, setImageToAnalyze] = useState<string | null>(null);
  const [imageToAnalyzeSize, setImageToAnalyzeSize] = useState({ width: 0, height: 0, bytes: 0 });
  const detectionSpeed = useSettingsStore(state => state.detection?.speed || 'normal');
  const storagePermission = useSettingsStore(state => state.permissions?.storage ?? true);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const [detectionMode, setDetectionMode] = useState<'live' | 'picture' | 'video' | 'batch'>('live');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [batchResults, setBatchResults] = useState<{fileName: string, sign: string, conf: number}[]>([]);
  const [isBatchResultDialogOpen, setIsBatchResultDialogOpen] = useState(false);
  const [selectedBatchAssets, setSelectedBatchAssets] = useState<any[]>([]);

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
    setSnackbarMsg(sessionId ? "Đã lưu vào phiên lịch sử!" : "Đã tạo phiên lịch sử mới!");
  };

  const onSaveMediaSession = () => {
    if (sessionHistory.length > 0 && pendingMediaUri && detectionMode !== 'live') {
      const signsToSave = detectionMode === 'video' ? sessionHistory.map(h => h.sign).reverse() : [sessionHistory[0].sign];
      addImageVideoSession(detectionMode as 'picture' | 'video', pendingMediaUri, signsToSave, activePackId || undefined);
      setSnackbarMsg("Đã lưu kết quả!");
      setSessionHistory([]);
      setPendingMediaUri(null);
    }
  };

  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const lastDetectionTime = useRef(0);
  const latestDetectionRef = useRef<any>(null);
  const recentPredictions = useRef<string[]>([]);
  const lastSpeechTime = useRef(0);
  const lastSpokenWord = useRef<string | null>(null);

  const handleDetection = useCallback((index: number, conf: number) => {
    const words = packWords[activePackId || '']?.map(w => w.word) || [];
    if (words.length > 0 && index >= 0 && index < words.length) {
      const word = words[index];
      latestDetectionRef.current = { wordStr: word, conf };
      
      const now = Date.now();
      const timeSinceLast = now - lastDetectionTime.current;

      recentPredictions.current.push(word);
      if (recentPredictions.current.length > 5) {
        recentPredictions.current.shift(); 
      }
      
      const counts = recentPredictions.current.reduce((acc: any, val) => {
         acc[val] = (acc[val] || 0) + 1;
         return acc;
      }, {});
      const smoothedWord = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

      // Chống nháy (Bug 22): Phải trên 3 phiếu (Đa số) mới cập nhật chữ mới
      if (counts[smoothedWord] >= 3) {
        if (isMounted.current) {
          setDetectedWord(smoothedWord);
          setConfidence(conf);
        }

        const shouldLogHistory = detectionMode === 'picture' || detectionMode === 'video' || timeSinceLast > 1000;

        if (conf >= thresholdValue) {
          if (shouldLogHistory) {
            triggerImpactFeedback();
            
            // Chống Spam Audio (Bug 23): Không đọc lại từ vừa đọc
            if (ttsSettings?.systemSounds !== false && smoothedWord && smoothedWord.trim() !== '' && (now - lastSpeechTime.current > 1500) && (lastSpokenWord.current !== smoothedWord)) {
              try {
                Speech.stop();
                Speech.speak(smoothedWord, { language: ttsSettings?.ttsLanguage || 'en-US', rate: ttsSettings?.voiceRate || 0.9 });
                lastSpeechTime.current = now;
                lastSpokenWord.current = smoothedWord;
              } catch (e) { console.warn("Speech API failed", e); }
            }
            
            if (detectionMode === 'picture') {
              if (isMounted.current) {
                setSessionHistory([{ id: now.toString(), sign: `${smoothedWord} (${Math.round(conf * 100)}%)` }]); 
                setIsHistoryDialogOpen(true);
                setIsProcessing(false);
              }
            } else {
              if (isMounted.current) {
                setSessionHistory(prev => {
                  if (detectionMode === 'live' && prev.length > 0 && prev[0].sign === smoothedWord && timeSinceLast < 2000) {
                     return prev; 
                  }
                  const newHistory = [{ id: now.toString(), sign: smoothedWord }, ...prev];
                  if (newHistory.length > 50) newHistory.length = 50;
                  return newHistory;
                });
              }
            }
            lastDetectionTime.current = now;
          }
        } else if (detectionMode === 'picture') {
          if (isMounted.current) {
            setSessionHistory([{ id: now.toString(), sign: `${smoothedWord} (${Math.round(conf * 100)}% - Thấp)` }]);
            setIsHistoryDialogOpen(true);
            setIsProcessing(false);
          }
        }
      }
    } else if (index !== undefined) {
      console.warn(`Model trả về index [${index}] vượt quá mảng từ vựng (Bug 10). Vui lòng cập nhật bộ từ!`);
    }
  }, [activePackId, packWords, ttsSettings, thresholdValue, detectionMode]);

  const [snackbarMsg, setSnackbarMsg] = useState("");
  const handleModelError = useCallback((errorMsg: string) => {
    setSnackbarMsg(errorMsg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
  }, []);

  const { isModelReady, boxedModel, modelShape, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, handleModelError);
  const [debugData, setDebugData] = useState<any>(null);

  const appState = useRef(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setIsAppActive(nextAppState === 'active');
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

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

  // Đã dọn dẹp các UseSharedValue gây Anti-pattern và Memory Leak dư thừa
  // ...

  const asyncRunner = useAsyncRunner();

  const frameOutput = useFrameOutput({
    onFrame: (frame) => {
      'worklet';
      // Mọi xử lý live giờ được chuyển về handleManualScan + runDetection queue
      // Worklet này chỉ giữ chỗ để tránh crash
      frame.dispose();
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
                if (fileUri.match(/\.(jpg|jpeg|png)$/i)) {
                  allImageUris.push(fileUri);
                } else if (!fileUri.match(/\.[a-zA-Z0-9]{2,4}$/)) {
                  // Cải thiện Regex (Bug 38): Nếu chuỗi không kết thúc bằng đuôi file truyền thống (3-4 chữ cái) thì coi là thư mục
                  await scanDirectory(fileUri);
                }
              }
            } catch (e: any) {
              // Báo cáo lỗi thay vì nuốt lỗi (Bug 39)
              console.warn(`Không thể truy cập thư mục: ${dirUri}`, e);
            }
          };

          setSnackbarMsg("Đang quét ảnh trong thư mục...");
          await scanDirectory(uri);
          
          if (allImageUris.length > 0) {
            const assets = allImageUris.map(imgUri => ({
              uri: imgUri,
              name: imgUri.split('%2F').pop() || 'image.jpg'
            }));
            
            setSelectedBatchAssets(assets);
            setSelectedMedia(assets[0].uri);
          } else {
            Alert.alert("Thông báo", "Không tìm thấy file ảnh nào trong thư mục này.");
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
      setSnackbarMsg("Chưa chọn file nào.");
      return;
    }
    setIsProcessing(true);
    setSnackbarMsg("Đang chuẩn bị ảnh...");
    setBatchResults([]);

    try {
      const results: {fileName: string, sign: string, conf: number}[] = [];
      
      for (let i = 0; i < selectedBatchAssets.length; i++) {
        // Thêm delay setTimeout(0) vào vòng lặp for để React có thời gian render Progress Bar.
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const asset = selectedBatchAssets[i];
        setSnackbarMsg(`Đang xử lý ${i + 1}/${selectedBatchAssets.length}...`);
        
        const fileName = asset.name || `image_${i}.jpg`;
        const destUri = asset.uri;

        latestDetectionRef.current = null; // Reset kết quả ảnh cũ
        if (clearQueue) clearQueue();
        
        // Không truyền facing cho ảnh Batch để tránh bị lật ngang sai logic
        runDetection(destUri, undefined, true);
        
        let attempts = 0;
        // Thêm điều kiện an toàn, nếu timeout 500 thì thoát và tính là lỗi
        while ((getDebugInfo().isProcessing || getDebugInfo().queueLength > 0) && attempts < 500) {
          await new Promise(r => setTimeout(r, 100));
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
      setSnackbarMsg(`Hoàn tất xử lý ${results.length} ảnh và đã lưu vào lịch sử!`);
      
    } catch (e: any) {
      console.error("Batch scan error:", e);
      setSnackbarMsg("Lỗi khi xử lý file/thư mục.");
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
        
        // Lấy thông tin file ảnh để hiện trên Dialog
        try {
          const FileSystem = require('expo-file-system/legacy');
          const Image = require('react-native').Image;
          const fileInfo = await FileSystem.getInfoAsync(finalMedia);
          Image.getSize(finalMedia, (width: number, height: number) => {
            setImageToAnalyzeSize({ width, height, bytes: fileInfo.size || 0 });
            setImageToAnalyze(finalMedia);
            setIsConfirmImageDialogOpen(true);
          }, () => {
            setImageToAnalyzeSize({ width: 0, height: 0, bytes: fileInfo.size || 0 });
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
          const timeToCapture = player.currentTime * 1000;
          const { uri } = await VideoThumbnails.getThumbnailAsync(actualMedia, { time: timeToCapture, quality: 0.8 });
          let finalMedia = uri;
          if (finalMedia && !finalMedia.startsWith('file://') && !finalMedia.startsWith('http') && finalMedia.startsWith('/')) {
            finalMedia = `file://${finalMedia}`;
          }
          setPendingMediaUri(actualMedia);
          result = runDetection(finalMedia, undefined);
        } catch (thumbErr: any) {
          result = { success: false, message: "Không thể trích xuất khung hình từ video: " + thumbErr.message };
        }
      } else {
        result = { success: false, message: "Chưa có file ảnh/video nào được chọn." };
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

    if (hasPermission && detectionSpeed !== 'off' && activePackId && (detectionMode === 'live' || detectionMode === 'video') && isLiveScanning) {
      cancelAnimation(scanAnimValue); // Fix Bug 38: Xóa hàng đợi Worklet trước khi gán mới
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
        
        if ((state.detectionMode === 'video' || state.detectionMode === 'live') && !isProcessing) {
          await handleManualScan();
        }
        
        if (isActive) timerId = setTimeout(loop, getInterval());
      };

      if (detectionMode === 'video' || detectionMode === 'live') {
        timerId = setTimeout(loop, 500);
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
        Alert.alert(i18n.t('detection.error'), i18n.t('detection.selectVideoFirst'));
        return;
      }
      if (detectionMode === 'video' && !isLiveScanning) {
        Alert.alert(
        i18n.t('detection.confirmVideoAnalysis'),
        i18n.t('detection.confirmVideoAnalysisDesc'),
        [
            { text: "Hủy", style: "cancel" },
            { text: "Bắt đầu", onPress: () => setIsLiveScanning(true) }
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

      try { new URL(cleanUrl); } catch (e) { throw new Error("Đường dẫn URL không hợp lệ."); }
      setSnackbarMsg("Đang kiểm tra kết nối mạng và ảnh...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        // Fix Bug 17: Vô hiệu hóa Cache mạng để luôn tải ảnh mới nhất
        const response = await fetch(cleanUrl, { 
          method: 'HEAD', 
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Server từ chối truy cập.`);
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) throw new Error("Không phải file ảnh.");
      } catch (e: any) {
        if (e.name === 'AbortError') throw new Error("Mạng quá yếu.");
        if (e.message.includes("Server từ chối") || e.message.includes("Không phải file ảnh")) throw e;
      }
      
      // Fix Bug 88: Siết chặt Regex lọc Extension chống Injection File
      const rawExt = cleanUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const safeExt = /^[a-zA-Z]{2,4}$/.test(rawExt) ? rawExt.toLowerCase() : 'jpg';
      const fileName = `dl_img_${Date.now()}.${safeExt}`;
      const destUri = `${FileSystem.cacheDirectory}${fileName}`;
      destUriTemp = destUri;

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
          const file = result.assets[0];
          const fileName = file.name || file.uri.split('/').pop() || 'custom.tflite';
          if (fileName.includes('..') || fileName.includes('/') || !fileName.toLowerCase().endsWith('.tflite')) {
             return Alert.alert(i18n.t('detection.securityError'), "Chỉ cho phép file model có định dạng .tflite hợp lệ.");
          }

          const targetPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({ from: file.uri, to: targetPath });
          setCustomModelUri(targetPath);
          Alert.alert(i18n.t('detection.success'), i18n.t('detection.customModelSuccess'));
        } catch (err: any) {
          Alert.alert(i18n.t('detection.invalidFile'), String(err.message || err || i18n.t('detection.invalidTflite')));
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (err: any) { 
      Alert.alert("Lỗi tải Model", String(err.message || err)); // Fix Bug 48: Ép kiểu string chống văng Object
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

  const handleDetectionModeChange = (mode: 'live' | 'picture' | 'video' | 'batch') => {
    clearQueue();
    // Fix Bug 31: Xóa bóng ma State (Stale Closure) khi đổi Mode
    recentPredictions.current = [];
    setDetectedWord(null);
    setConfidence(0);
    setDetectionMode(mode);
  };

  return {
    theme, developerDebugMode, facing, flash, hasPermission, requestPermission, device,
    activePackId, activePack, setActivePack, customModelUri, setCustomModelUri, downloadedPacks,
    sessionHistory, setSessionHistory, onSaveSession, onSaveMediaSession,
    debugData, isDebugDialogOpen, setIsDebugDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    isConfirmImageDialogOpen, setIsConfirmImageDialogOpen,
    imageToAnalyze, imageToAnalyzeSize,
    confirmImageAnalysis: () => {
      setIsConfirmImageDialogOpen(false);
      if (imageToAnalyze) {
        setPendingMediaUri(imageToAnalyze);
        runDetection(imageToAnalyze, undefined);
      }
    },
    detectedWord, confidence, detectionSpeed, updateSettings,
    detectionMode, setDetectionMode: handleDetectionModeChange,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia, selectedBatchAssets,
    isProcessing, snackbarMsg, setSnackbarMsg,
    frameOutput, isUrlDialogOpen, setIsUrlDialogOpen, urlInput, setUrlInput,
    player, scanAnimStyle, camera, isAppActive, isFocused,
    onPressManualScan, pickImage, pickVideo, pickBatchImages, handleUrlImage, pickModelFile,
    toggleCameraFacing, toggleFlash, clearQueue, packWords, modelWidth, modelShape,
    batchResults, isBatchResultDialogOpen, setIsBatchResultDialogOpen
  };
}
