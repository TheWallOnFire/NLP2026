import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import { useSharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
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
import { useResizer } from 'react-native-vision-camera-resizer';
import { useHandDetectionModel } from './useHandDetectionModel';
import { useSignLanguageModel } from './useSignLanguageModel';
import { triggerSelectionFeedback, triggerImpactFeedback } from '../../../utils/feedback';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import * as ImageManipulator from 'expo-image-manipulator';
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
  
  const { isHandModelReady, boxedHandModel } = useHandDetectionModel();
  const { resizer } = useResizer({
    width: 192,
    height: 192,
    channelOrder: 'rgb',
    dataType: 'float32',
    scaleMode: 'cover',
    pixelLayout: 'interleaved',
  });

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

  const detectionSpeed = useSettingsStore(state => state.detection?.speed || 'normal');
  const storagePermission = useSettingsStore(state => state.permissions?.storage ?? true);
  const updateSettings = useSettingsStore(state => state.updateSettings);

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

      // Yêu cầu của user: Bỏ hẳn Anti-Flicker, lấy luôn kết quả của khung hình hiện tại (1 Vote) để đạt tốc độ thời gian thực tuyệt đối
      const smoothedWord = word;

      if (true) {
        if (isMounted.current) {
          // Fix Bug 1 UI/UX: Rerender Throttling. Giảm tải từ 30 FPS xuống còn cập nhật khi chữ đổi hoặc mỗi 200ms
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

        // Yêu cầu của user: Lưu Toàn Bộ vào Result History mà không cần bất kỳ điều kiện phức tạp nào!
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
              // Lưu trực tiếp mọi kết quả kèm % tự tin dạng tham số để UI đổi màu
              const newHistory = [{ id: uniqueId, sign: smoothedWord, conf: conf }, ...prev];
              if (newHistory.length > 50) newHistory.length = 50; // Giữ tối đa 50 kết quả gần nhất để tránh OOM
              return newHistory;
            });
            setIsProcessing(false); // Fix lỗi kẹt mode Auto/Live
          }
        }
        
        lastDetectionTime.current = now;
        lastLoggedWord.current = smoothedWord;

        // Vẫn giữ điều kiện cho Rung và Đọc (để tránh điện thoại bị rung liệt mô-tơ và văng App)
        if (conf >= thresholdValue) {
          // Fix Bug 42: Chống Spam Rung (Chỉ rung tối đa 1 lần mỗi 800ms)
          if (now - lastHapticTime.current > 800) {
            // Fix Khựng UI do Haptics
            setTimeout(() => triggerImpactFeedback(), 0);
            lastHapticTime.current = now;
          }
          
          // Fix Bug 48: Chống thắt cổ chai TTS (Dọn sạch hàng đợi TTS cũ trước khi đọc từ mới)
          if (ttsSettings?.systemSounds !== false && smoothedWord && smoothedWord.trim() !== '' && (now - lastSpeechTime.current > 1500) && (lastSpokenWord.current !== smoothedWord)) {
            // Fix Bug 5 UI/UX: Gọi Speech API trong setTimeout để nó đẩy xuống đáy Callback Queue, không chặn quá trình vẽ Layout của React
            setTimeout(() => {
              try {
                Speech.stop(); // Stop immediately clears the queue
                Speech.speak(smoothedWord, { language: ttsSettings?.ttsLanguage || 'en-US', rate: ttsSettings?.voiceRate || 0.9 });
              } catch (e) { console.warn("Speech API failed", e); }
            }, 16);
            lastSpeechTime.current = now;
            lastSpokenWord.current = smoothedWord;
          }
        }
      }
    } else if (index !== undefined) {
      console.warn(`Model trả về index [${index}] vượt quá mảng từ vựng (Bug 10). Vui lòng cập nhật bộ từ!`);
    }
  }, [activePackId, packWords, ttsSettings, thresholdValue, detectionMode]);

  const handleModelError = useCallback((errorMsg: string) => {
    setSnackbarMsg(errorMsg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
    setIsProcessing(false); // Fix Bug: Nhả khóa màn hình nếu Model gặp lỗi
  }, []);

  const { isModelReady, boxedModel, modelShape, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, handleModelError);
  const [debugData, setDebugData] = useState<any>(null);

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
        const FileSystem = require('expo-file-system/legacy');
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

  const handBox = useSharedValue({ x: 0, y: 0, w: 0, h: 0, score: 0 });
  const autoState = useSharedValue(0); // 0: Searching, 1: Locking, 2: Monitoring
  const lockStartTime = useSharedValue(0);
  const lastClassifyTime = useSharedValue(0);
  const searchDelayEndTime = useSharedValue(0); 
  const lastWorkletLogTime = useSharedValue(0);
  const handLostTime = useSharedValue(0); // Bộ đệm thời gian mất dấu tay

  const triggerAutoScan = () => {
    if (detectionMode === 'auto' && isLiveScanning && !isProcessing) {
      handleManualScan(null, true);
    }
  };

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame: (frame) => {
      'worklet';
      const mode = detectionMode;
      const live = isLiveScanning;
      
      if (mode === 'auto' && live && isHandModelReady && boxedHandModel && resizer) {
        const now = Date.now();
        if (now > searchDelayEndTime.value) {
          let resized: any = null;
          try {
            resized = resizer.resize(frame);
            const buffer = resized.getPixelBuffer();
            const floatBuffer = new Float32Array(buffer);
            
            // CHUẨN HÓA PIXEL: Dùng phép nhân (nhanh hơn phép chia) để tối ưu hoá vòng lặp 110,592 phần tử
            const inv = 1.0 / 127.5;
            for (let i = 0; i < floatBuffer.length; i++) {
              floatBuffer[i] = floatBuffer[i] * inv - 1.0;
            }
            
            const outputs = boxedHandModel.unbox().runSync([floatBuffer]);

            let maxLogit = -100;
            let maxIdx = -1;
            let regBuffer = null;

            if (outputs && outputs.length > 0) {
              for (let i = 0; i < outputs.length; i++) {
                const out = outputs[i];
                const byteLen = out.byteLength;
                if (byteLen === 8064 || (out.length && out.length === 2016)) {
                  const arr = out.length ? out : new Float32Array(out);
                  for (let j = 0; j < 2016; j++) {
                    if (arr[j] > maxLogit) {
                      maxLogit = arr[j];
                      maxIdx = j;
                    }
                  }
                } else if (byteLen === 145152 || (out.length && out.length === 36288)) {
                  regBuffer = out.length ? out : new Float32Array(out);
                }
              }
            }
            if (maxLogit > 0.5 && maxIdx !== -1 && regBuffer) { 
              handLostTime.value = 0; // Đặt lại bộ đệm vì đã tìm thấy tay
              // Giải mã toạ độ Bounding Box
              let cx = 0, cy = 0;
              if (maxIdx < 1152) { // Lưới 24x24
                 const cell_y = Math.floor(maxIdx / 48);
                 const cell_x = Math.floor((maxIdx % 48) / 2);
                 cx = (cell_x + 0.5) / 24;
                 cy = (cell_y + 0.5) / 24;
              } else { // Lưới 12x12
                 const rem = maxIdx - 1152;
                 const cell_y = Math.floor(rem / 72);
                 const cell_x = Math.floor((rem % 72) / 6);
                 cx = (cell_x + 0.5) / 12;
                 cy = (cell_y + 0.5) / 12;
              }
              
              const dx = regBuffer[maxIdx * 18 + 0];
              const dy = regBuffer[maxIdx * 18 + 1];
              const w = regBuffer[maxIdx * 18 + 2];
              const h = regBuffer[maxIdx * 18 + 3];
              
              const palm_cx = cx + dx / 192;
              const palm_cy = cy + dy / 192;
              const palm_w = w / 192;
              const palm_h = h / 192;
              
              // Tính toán kích thước và làm mượt (EMA Smoothing) để chống giật khung hình
              let target_x = palm_cx - palm_w * 1.5;
              let target_y = palm_cy - palm_h * 1.5;
              let target_w = palm_w * 3;
              let target_h = palm_h * 3;
              
              if (handBox.value.score > 0) {
                 const s = 0.35; // Tốc độ làm mượt 35% mỗi frame (mượt mà nhưng không bị lag theo sau)
                 target_x = handBox.value.x + (target_x - handBox.value.x) * s;
                 target_y = handBox.value.y + (target_y - handBox.value.y) * s;
                 target_w = handBox.value.w + (target_w - handBox.value.w) * s;
                 target_h = handBox.value.h + (target_h - handBox.value.h) * s;
              }

              handBox.value = { 
                  x: target_x, 
                  y: target_y, 
                  w: target_w, 
                  h: target_h, 
                  score: maxLogit 
              };

              if (now - lastWorkletLogTime.value > 1000) {
                 console.log(`[AutoMode] Bám tay mượt... Logit: ${maxLogit.toFixed(2)}, State: ${autoState.value}`);
                 lastWorkletLogTime.value = now;
              }

              // State Machine cho Auto Mode
              if (autoState.value === 0) {
                 console.log(`[AutoMode] Phát hiện tay! Trạng thái 0 -> 1 (Bắt đầu khóa 1s)`);
                 autoState.value = 1;
                 lockStartTime.value = now;
              } else if (autoState.value === 1) {
                 if (now - lockStartTime.value > 1000) { // Chờ 1s khóa tay
                     console.log(`[AutoMode] Đã khóa tay 1s! Trạng thái 1 -> 2 (Kích hoạt nhận diện)`);
                     autoState.value = 2;
                     lastClassifyTime.value = now;
                     runOnJS(triggerAutoScan)();
                 }
              } else if (autoState.value === 2) {
                 // Mỗi 1.5s nhận diện lại để xem ký tự có đổi không
                 if (now - lastClassifyTime.value > 1500) {
                     console.log(`[AutoMode] Đang theo dõi (Trạng thái 2). Kích hoạt nhận diện vòng lặp!`);
                     lastClassifyTime.value = now;
                     runOnJS(triggerAutoScan)();
                 }
              }
            } else {
              if (handLostTime.value === 0) {
                  handLostTime.value = now; // Bắt đầu tính giờ mất dấu
              }
              
              // Khoan dung (Grace period) 400ms. Nếu mất dấu tay quá 400ms thì mới HỦY khóa và Reset
              if (now - handLostTime.value > 400) {
                  handBox.value = { x: 0, y: 0, w: 0, h: 0, score: -100 };
                  if (autoState.value !== 0) {
                     console.log(`[AutoMode] Mất dấu tay thực sự! Trạng thái ${autoState.value} -> 0.`);
                     autoState.value = 0;
                     // Trễ 0.5 giây khi RỚT NHỊP
                     searchDelayEndTime.value = now + 500;
                  } else {
                     if (now - lastWorkletLogTime.value > 2000) {
                         console.log(`[AutoMode] Đang tìm kiếm... Logit cao nhất: ${maxLogit.toFixed(2)}`);
                         lastWorkletLogTime.value = now;
                     }
                  }
              }
            }
          } catch(e) {
          } finally {
            if (resized) {
               resized.dispose();
            }
          }
        }
      }
      
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
        // Fix Bug 9 (Batch Interleaving): Dừng vòng lặp ngay lập tức nếu người dùng thoát Component
        if (!isMounted.current) break;
        
        // Fix Bug 4 UI/UX: Đổi setTimeout(0) thành setTimeout(16) (Tương đương 1 Frame 60FPS) để ép JS Thread nhả Event Loop cho UI Thread render Snackbar
        await new Promise(resolve => setTimeout(resolve, 16));
        
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
      if (detectionMode === 'live' || detectionMode === 'auto') {
        if (camera.current && (isManualClick || isLiveScanning)) {
          try {
            // Fix Lỗi Logic Race Condition (Ghost Crop): Đọc tọa độ khung xanh NGAY LẬP TỨC trước khi chụp ảnh, 
            // nếu đọc sau khi chụp (mất 100ms), tay đã di chuyển sang chỗ khác khiến ảnh Crop bị trượt mục tiêu.
            const currentHandBox = detectionMode === 'auto' ? { ...handBox.value } : null;

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
              
              let finalImagePath = imagePath;
              // Tính năng crop tay khi đang ở Auto Mode
              if (detectionMode === 'auto' && currentHandBox && currentHandBox.score > 0.5) {
                const box = currentHandBox;
                if ((photo as any).width && (photo as any).height) {
                  const pWidth = (photo as any).width;
                  const pHeight = (photo as any).height;
                  
                  // Tính toán tỷ lệ khung hình thật của Snapshot (VD: 9/16 = 0.5625)
                  const R = pWidth / pHeight; 
                  console.log(`[AutoMode-Crop] Snapshot gốc: ${pWidth}x${pHeight} (Tỷ lệ R=${R.toFixed(3)})`);
                  
                  // Ánh xạ toạ độ từ 1:1 (Resizer) sang tỷ lệ thực của Snapshot
                  // Vì cover crop chiều cao, phần bị cắt trên/dưới là (1 - R) / 2
                  const snap_x = box.x;
                  const snap_y = (1 - R) / 2 + box.y * R;
                  const snap_w = box.w;
                  const snap_h = box.h * R;
                  
                  // Chống Crash (Bắt lỗi ngoài ranh giới cho Crop ảnh)
                  let originX = Math.round(snap_x * pWidth);
                  let originY = Math.round(snap_y * pHeight);
                  let w = Math.round(snap_w * pWidth);
                  let h = Math.round(snap_h * pHeight);
                  
                  originX = Math.max(0, Math.min(pWidth - 1, originX));
                  originY = Math.max(0, Math.min(pHeight - 1, originY));
                  
                  if (originX + w > pWidth) w = pWidth - originX;
                  if (originY + h > pHeight) h = pHeight - originY;
                  
                  console.log(`[AutoMode-Crop] Cắt lấy tay: originX=${originX}, originY=${originY}, w=${w}, h=${h}`);
                  
                  if (w > 10 && h > 10) {
                    try {
                      const manipResult = await ImageManipulator.manipulateAsync(
                        imagePath,
                        [{ crop: { originX, originY, width: w, height: h } }],
                        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
                      );
                      finalImagePath = manipResult.uri;
                    } catch (e) {
                      console.warn("Lỗi crop ảnh tự động:", e);
                    }
                  }
                }
              }
              
              result = runDetection(finalImagePath, facing, true);
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

    if (hasPermission && detectionSpeed !== 'off' && activePackId && (detectionMode === 'live' || detectionMode === 'video' || detectionMode === 'auto') && isLiveScanning) {
      const loop = async () => {
        if (!isActive) return;
        const state = scannerState.current;
        if (!state.isLiveScanning || state.detectionSpeed === 'off' || !state.hasPermission) return;
        
        // Mode Auto không gọi tự động theo thời gian nữa, mà do Frame Processor (bàn tay) kích hoạt
        if ((state.detectionMode === 'video' || state.detectionMode === 'live') && !isProcessing) {
          await handleManualScan();
        }
        
        if (isActive) timerId = setTimeout(loop, getInterval());
      };

      if (detectionMode === 'video' || detectionMode === 'live') {
        timerId = setTimeout(loop, 500);
      }
    } else {
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
    if ((detectionMode === 'live' || detectionMode === 'video' || detectionMode === 'auto') && detectionSpeed !== 'off') {
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
      setSnackbarMsg("Đang tải ảnh...");

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
            if (result.status === 206) throw new Error("Dữ liệu bị rách (Partial Content)."); // Fix Bug 24
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
          
          // Fix Bug 37 (GZIP Bomb Limit): Không cho phép tải model vượt quá 200MB để tránh tràn RAM
          if (file.size && file.size > 200 * 1024 * 1024) {
             return Alert.alert("Dung lượng quá lớn", "File model không được vượt quá 200MB.");
          }
          
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

  const handleDetectionModeChange = (mode: 'live' | 'picture' | 'video' | 'batch' | 'auto') => {
    clearQueue();
    // Fix Bug Logic State Machine: Reset toàn bộ Worklet SharedValues khi đổi Mode để tránh kẹt trạng thái
    autoState.value = 0;
    handLostTime.value = 0;
    searchDelayEndTime.value = 0;
    handBox.value = { x: 0, y: 0, w: 0, h: 0, score: -100 };
    
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
        setIsProcessing(true); // Fix Bug: Khóa chạm màn hình để chờ AI xử lý
        runDetection(imageToAnalyze, undefined);
      }
    },
    detectedWord, confidence, detectionSpeed, updateSettings,
    detectionMode, setDetectionMode: handleDetectionModeChange,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia, selectedBatchAssets,
    isProcessing, snackbarMsg, setSnackbarMsg,
    frameOutput, isUrlDialogOpen, setIsUrlDialogOpen, urlInput, setUrlInput,
    player, camera, isAppActive, isFocused,
    onPressManualScan, pickImage, pickVideo, pickBatchImages, handleUrlImage, pickModelFile,
    toggleCameraFacing, toggleFlash, clearQueue, packWords, modelShape,
    batchResults, isBatchResultDialogOpen, setIsBatchResultDialogOpen,
    handBox, autoState
  };
}
