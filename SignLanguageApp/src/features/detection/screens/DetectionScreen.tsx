import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Linking, Animated, Alert, SafeAreaView, AppState } from 'react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../hooks/useSignLanguageModel';
import { triggerSelectionFeedback, triggerImpactFeedback } from '../../../utils/feedback';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { History as HistoryIcon, ListTodo } from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer } from 'expo-video';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';

// Import components
import TopOptionsBar from '../components/TopOptionsBar';
import MediaScanner from '../components/MediaScanner';
import DetectionSidebar from '../components/DetectionSidebar';
import DetectionResultBanner from '../components/DetectionResultBanner';
import DetectionDialogs from '../components/DetectionDialogs';
import DebugOverlay from '../components/DebugOverlay';

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
    
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri
    });
    
    return destUri;
  } catch (error) {
    console.error("Failed to save media to app storage", error);
    return sourceUri;
  }
};

export default function DetectionScreen({ navigation }: any) {
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
  const downloadedPacks = packs.filter(p => p.isDownloaded);
  const activePack = downloadedPacks.find(p => p.id === activePackId);

  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);
  const history = useHistoryStore(state => state.history).filter(h => h.type === 'detection');

  const handleDetection = useCallback((index: number, conf: number) => {
    if (Date.now() - lastDetectionTime.current > 1000) {
      const words = packWords[activePackId || '']?.map(w => w.word) || [];
      if (words.length > 0 && index >= 0 && index < words.length) {
        const word = words[index];
        setDetectedWord(word);
        setConfidence(conf);
        lastDetectionTime.current = Date.now();

        if (conf > 0.8) {
          triggerImpactFeedback();
          if (ttsSettings?.systemSounds !== false && word && word.trim() !== '') {
            try {
              Speech.stop();
              Speech.speak(word, { language: ttsSettings?.ttsLanguage || 'en-US', rate: ttsSettings?.voiceRate || 0.9 });
            } catch (e) {
              console.warn("Speech API failed", e);
            }
          }
          addHistoryItem({
            sign: word,
            type: 'detection',
            date: new Date().toISOString(),
            time: new Date().toISOString(),
          });
        }
      }
    }
  }, [activePackId, packWords, ttsSettings, addHistoryItem]);
  const lastDetectionTime = useRef(0);

  const handleModelError = useCallback((errorMsg: string) => {
    setSnackbarMsg(errorMsg);
  }, []);

  const { isModelReady, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, handleModelError);
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
  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const detectionSpeed = useSettingsStore(state => state.detection?.speed || 'normal');
  const storagePermission = useSettingsStore(state => state.permissions?.storage ?? true);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const [detectionMode, setDetectionMode] = useState<'live' | 'picture' | 'video'>('live');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  
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
      if (clearQueue) clearQueue(); // Ngăn tràn JNI Global Ref (Lỗi 4)
    }
  }, [isAppActive, player, clearQueue]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (flash) {
      timeout = setTimeout(() => setFlash(false), 180000);
    }
    return () => clearTimeout(timeout);
  }, [flash]);

  const scanAnimValue = useSharedValue(0);
  const scanAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanAnimValue.value * 200 }]
  }));
  const camera = useRef<any>(null);

  useEffect(() => {
    navigation.setOptions({
      autoHideHomeIndicator: true,
      headerShown: false,
    });
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

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({ 
          playsInSilentModeIOS: true,
          interruptionModeAndroid: 1, // DoNotMix
          interruptionModeIOS: 1      // DoNotMix
        });
      } catch (e) {}
    };
    setupAudio();
  }, []);

  const scannerState = useRef({ hasPermission, detectionSpeed, activePackId, detectionMode, isLiveScanning });
  scannerState.current = { hasPermission, detectionSpeed, activePackId, detectionMode, isLiveScanning };

  useEffect(() => {
    let isActive = true;
    let timerId: NodeJS.Timeout;

    if (hasPermission && detectionSpeed !== 'off' && activePackId && (detectionMode === 'live' || detectionMode === 'video') && isLiveScanning) {
      scanAnimValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      );

      const loop = async () => {
        if (!isActive) return;
        const state = scannerState.current;
        
        // Cập nhật lại logic quét nếu trạng thái thay đổi thay vì hủy toàn bộ useEffect
        if (!state.isLiveScanning || state.detectionSpeed === 'off' || !state.hasPermission || (state.detectionMode !== 'live' && state.detectionMode !== 'video')) {
          return;
        }

        await handleManualScan();
        if (isActive) {
           timerId = setTimeout(loop, getInterval());
        }
      };
      
      timerId = setTimeout(loop, detectionMode === 'live' ? 1500 : 0);
    } else {
      cancelAnimation(scanAnimValue);
      setDetectedWord(null);
      setConfidence(0);
    }

    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [hasPermission, activePackId, detectionMode, isModelReady, isAppActive]); // Thêm isAppActive để restart Animation sau Doze Mode (Lỗi 18)

  useEffect(() => {
    if (!isDebugDialogOpen && !developerDebugMode) {
      return;
    }
    
    if (getDebugInfo) {
      setDebugData(getDebugInfo());
    }

    const interval = setInterval(() => {
      if (getDebugInfo) {
        setDebugData(getDebugInfo());
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isDebugDialogOpen, developerDebugMode, getDebugInfo]);

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
        if (camera.current) {
          try {
            const photo = await camera.current.takeSnapshot({
              quality: 85
            });
            let imagePath = photo?.path || (photo as any)?.uri || (typeof photo === 'string' ? photo : undefined);
            if (imagePath && !imagePath.startsWith('file://') && !imagePath.startsWith('http') && imagePath.startsWith('/')) {
              imagePath = `file://${imagePath}`;
            }
            if (imagePath && isManualClick && storagePermission) {
              imagePath = await saveMediaToAppStorage(imagePath);
              // Tự động chuyển sang chế độ Picture để người dùng xem lại ảnh vừa chụp
              setDetectionMode('picture');
              setSelectedMedia(imagePath);
            }
            result = runDetection(imagePath, facing, true); // bypassDuplicateCheck = true
          } catch (cameraError: any) {
            if (cameraError?.message?.includes("isn't ready") || cameraError?.message?.includes("not ready")) {
              console.log("Camera đang khởi động, bỏ qua frame này...");
              result = undefined;
            } else {
              throw cameraError;
            }
          }
        } else {
          result = { success: false, message: "Camera chưa sẵn sàng." };
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
          const { uri } = await VideoThumbnails.getThumbnailAsync(actualMedia, {
            time: timeToCapture,
            quality: 0.8,
          });
          
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
        if (result.success) {
          setSnackbarMsg(result.message);
        } else {
          Alert.alert("Từ chối", result.message);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (isManualClick) {
        Alert.alert("Lỗi quá trình quét", e.message || String(e));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const onPressManualScan = async () => {
    if ((detectionMode === 'live' || detectionMode === 'video') && detectionSpeed !== 'off') {
      if (detectionMode === 'video' && !selectedMedia) {
        Alert.alert("Lỗi", "Vui lòng chọn video trước khi quét.");
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
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const savedUri = storagePermission ? await saveMediaToAppStorage(uri) : uri;
      setSelectedMedia(savedUri);
      setIsLiveScanning(false);
      handleManualScan(savedUri, true);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const savedUri = storagePermission ? await saveMediaToAppStorage(uri) : uri;
      setSelectedMedia(savedUri);
      setIsLiveScanning(false);
      handleManualScan(savedUri, true);
    }
  };

  const handleUrlImage = async (url: string) => {
    if (!url) return;
    try {
      setIsProcessing(true);
      const cleanUrl = url.trim();

      // 1. Kiểm tra định dạng URL
      try {
        new URL(cleanUrl);
      } catch (e) {
        throw new Error("Đường dẫn URL không hợp lệ. Vui lòng nhập link đúng chuẩn bắt đầu bằng http:// hoặc https://");
      }

      setSnackbarMsg("Đang kiểm tra kết nối mạng và ảnh...");

      // 2. Pre-flight check: Kiểm tra mạng và loại file (Timeout 5s)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(cleanUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server từ chối truy cập (HTTP ${response.status}). Link ảnh có thể đã chết hoặc yêu cầu quyền.`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          throw new Error("Đường dẫn này không trỏ tới một file ảnh hợp lệ (Content-Type không phải là ảnh).");
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          throw new Error("Mạng quá yếu hoặc không có kết nối Internet.");
        }
        // Nếu lỗi do server chặn HEAD request, ta vẫn tiếp tục thử tải qua FileSystem
        if (e.message.includes("Server từ chối") || e.message.includes("không trỏ tới một file ảnh")) {
          throw e; 
        }
      }

      const ext = cleanUrl.split('.').pop()?.split('?')[0] || 'jpg';
      // Sử dụng tên file cố định để ghi đè, tránh rò rỉ bộ nhớ (Storage Leak)
      const fileName = `downloaded_image_temp.${ext}`;
      const destUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Xóa file cũ nếu tồn tại để chắc chắn ghi đè
      try {
        const fileInfo = await FileSystem.getInfoAsync(destUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(destUri, { idempotent: true });
        }
      } catch (e) {}

      setSnackbarMsg("Đang tải ảnh...");
      
      const downloadWithRetry = async (url: string, dest: string, retries = 2, timeoutMs = 15000): Promise<any> => {
        for (let i = 0; i <= retries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const downloadPromise = FileSystem.downloadAsync(url, dest);
            
            // Promise.race with a manual timeout rejection if AbortController isn't fully supported
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Timeout")), timeoutMs)
            );
            
            const result = await Promise.race([downloadPromise, timeoutPromise]) as FileSystem.FileSystemDownloadResult;
            clearTimeout(timeoutId);
            
            if (result.status === 200) return result;
            if (i === retries) throw new Error(`Tải ảnh thất bại. Server trả về trạng thái: ${result.status}`);
          } catch (error) {
            if (i === retries) throw error;
            console.log(`[Network] Thử tải lại ảnh lần ${i + 1}...`);
          }
        }
      };

      const { uri, status, headers } = await downloadWithRetry(cleanUrl, destUri);

      // Kiểm tra lại Content-Type sau khi tải (đề phòng link chuyển hướng sang trang HTML)
      const downloadedType = headers['content-type'] || headers['Content-Type'];
      if (downloadedType && !downloadedType.toLowerCase().includes('image/')) {
        throw new Error("File tải về bị lỗi định dạng (không phải ảnh thực sự).");
      }

      const finalUri = uri;
      
      if (appState.current !== 'active') return; // Chặn cập nhật state nếu OS đã đưa app vào background

      setSelectedMedia(finalUri);
      setIsLiveScanning(false);
      setUrlInput("");
      setIsUrlDialogOpen(false);
      setSnackbarMsg("Tải thành công! Bắt đầu quét...");
      await handleManualScan(finalUri, true);
    } catch (err: any) {
      Alert.alert("Lỗi tải ảnh", err.message || "Không thể tải ảnh. Vui lòng kiểm tra lại mạng hoặc link ảnh.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pickModelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        
        if (fileName.includes('..') || fileName.includes('/')) {
          Alert.alert("Security Error", "Invalid file name detected.");
          return;
        }

        if (fileName.endsWith('.tflite')) {
          setCustomModelUri(fileUri);
          Alert.alert("Success", "Custom TFLite model loaded successfully!");
        } else {
          Alert.alert("Invalid File", "Please select a valid .tflite model file.");
        }
      }
    } catch (err) {
      console.error("Failed to pick model", err);
    }
  };

  const translateY = 0; // Not used anymore

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <IconButton icon="camera-off" size={64} iconColor={theme.colors.error} />
          <Text variant="headlineSmall" style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.message}>
            We need your permission to access the camera for real-time sign language detection. If you have denied it previously, you may need to open system settings.
          </Text>
          <Button mode="contained" onPress={async () => {
              const granted = await requestPermission();
              if (!granted) {
                Alert.alert(
                  "Yêu cầu Quyền Camera",
                  "Vui lòng vào Cài đặt của hệ thống để cấp quyền Máy ảnh cho ứng dụng.",
                  [
                    { text: "Hủy", style: "cancel" },
                    { text: "Mở Cài đặt", onPress: () => Linking.openSettings() }
                  ]
                );
              }
            }} style={{ borderRadius: 24 }}>
            Grant Permission / Open Settings
          </Button>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    triggerSelectionFeedback();
    setFacing(current => {
      const nextFacing = current === 'back' ? 'front' : 'back';
      if (nextFacing === 'front') {
        setFlash(false); // Vô hiệu hóa/tắt flash khi dùng camera trước
      }
      return nextFacing;
    });
  };

  const toggleFlash = () => {
    if (facing === 'front') return; // Không cho bật flash camera trước
    triggerSelectionFeedback();
    setFlash(!flash);
  };

  const handleDetectionModeChange = (mode: 'live' | 'picture' | 'video') => {
    clearQueue();
    setDetectionMode(mode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <TopOptionsBar 
        theme={theme}
        detectionMode={detectionMode}
        setDetectionMode={handleDetectionModeChange}
        setSelectedMedia={setSelectedMedia}
        setIsLiveScanning={setIsLiveScanning}
        activePackId={activePackId}
        activePack={activePack}
        setActivePack={setActivePack}
        customModelUri={customModelUri}
        setCustomModelUri={setCustomModelUri}
        downloadedPacks={downloadedPacks}
        pickModelFile={pickModelFile}
      />

      <View style={styles.mediaContainer}>
        {developerDebugMode && (
          <DebugOverlay 
            debugData={debugData} 
            activePackWords={packWords[activePackId || '']?.map(w => w.word) || []}
          />
        )}
        
        <MediaScanner 
          detectionMode={detectionMode}
          device={device}
          cameraRef={camera}
          flash={flash}
          activePackId={activePackId}
          detectionSpeed={detectionSpeed}
          isLiveScanning={isLiveScanning}
          scanAnimStyle={scanAnimStyle}
          selectedMedia={selectedMedia}
          player={player}
          pickImage={pickImage}
          pickVideo={pickVideo}
          isAppActive={isAppActive && isFocused}
        />

        <DetectionSidebar 
          theme={theme}
          detectionMode={detectionMode}
          detectionSpeed={detectionSpeed}
          updateSettings={updateSettings}
          toggleCameraFacing={toggleCameraFacing}
          toggleFlash={toggleFlash}
          flash={flash}
          pickImage={pickImage}
          pickVideo={pickVideo}
          isLiveScanning={isLiveScanning}
          isProcessing={isProcessing}
          activePackId={activePackId}
          selectedMedia={selectedMedia}
          onPressManualScan={onPressManualScan}
          setIsUrlDialogOpen={setIsUrlDialogOpen}
        />
      </View>

      <DetectionResultBanner 
        theme={theme}
        activePack={activePack}
        detectedWord={detectedWord}
        confidence={confidence}
      />

      <View style={styles.actionButtonsRow}>
        <Button 
          mode="contained-tonal" 
          icon={() => <HistoryIcon color={theme.colors.primary} size={20} />} 
          onPress={() => setIsHistoryDialogOpen(true)}
          style={styles.actionBtn}
        >
          History
        </Button>
        <Button 
          mode="contained-tonal" 
          icon={() => <ListTodo color={theme.colors.primary} size={20} />} 
          onPress={() => setIsDebugDialogOpen(true)}
          style={styles.actionBtn}
        >
          Pending Queue
        </Button>
      </View>

      <DetectionDialogs 
        theme={theme}
        isHistoryDialogOpen={isHistoryDialogOpen}
        setIsHistoryDialogOpen={setIsHistoryDialogOpen}
        history={history}
        isDebugDialogOpen={isDebugDialogOpen}
        setIsDebugDialogOpen={setIsDebugDialogOpen}
        debugData={debugData}
        snackbarMsg={snackbarMsg}
        setSnackbarMsg={setSnackbarMsg}
        isUrlDialogOpen={isUrlDialogOpen}
        setIsUrlDialogOpen={setIsUrlDialogOpen}
        handleUrlImage={handleUrlImage}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  mediaContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
  },
});
