import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Linking, Animated, ScrollView, TouchableOpacity, Alert, Image, SafeAreaView } from 'react-native';
import { Text, Button, useTheme, IconButton, Card, Badge, ActivityIndicator, Dialog, Portal, Menu, Divider, Snackbar } from 'react-native-paper';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../hooks/useSignLanguageModel';
import { triggerSelectionFeedback, triggerImpactFeedback } from '../../../utils/feedback';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ChevronDown, History as HistoryIcon, Brain, Camera as CameraIcon, Image as ImageIcon, Video as VideoIcon, RotateCcw, Zap, ZapOff, Timer, FolderOpen, ListTodo } from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';

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

        if (conf > 0.8 && Math.random() > 0.9) {
          triggerImpactFeedback();
          if (ttsSettings?.systemSounds !== false) {
            Speech.speak(word, { language: ttsSettings?.ttsLanguage || 'en-US', rate: ttsSettings?.voiceRate || 0.9 });
          }
          addHistoryItem({
            sign: word,
            type: 'detection',
            date: 'Today',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    }
  }, [activePackId, packWords, ttsSettings, addHistoryItem]);
  const lastDetectionTime = useRef(0);

  const { isModelReady, runDetection, getDebugInfo } = useSignLanguageModel(handleDetection);
  const developerDebugMode = useSettingsStore(state => state.developerDebugMode);
  const [debugData, setDebugData] = useState<{ queueLength: number, isProcessing: boolean, processingItem: string | null, queue: string[] } | null>(null);
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const detectionSpeed = useSettingsStore(state => state.detection?.speed || 'normal');
  const storagePermission = useSettingsStore(state => state.permissions?.storage ?? true);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const [detectionMode, setDetectionMode] = useState<'live' | 'picture' | 'video'>('live');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const player = useVideoPlayer(detectionMode === 'video' ? selectedMedia : null, player => {
    if (player) {
      player.loop = true;
      player.play();
    }
  });

  const scanAnim = useRef(new Animated.Value(0)).current;
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
    let isActive = true;
    let timerId: NodeJS.Timeout;

    if (hasPermission && detectionSpeed !== 'off' && activePackId && detectionMode === 'live') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();

      const loop = async () => {
        if (!isActive) return;
        await handleManualScan();
        if (isActive) {
           timerId = setTimeout(loop, getInterval());
        }
      };
      
      // Delay the first scan by 1.5 seconds to let the camera warm up
      timerId = setTimeout(loop, 1500);
    } else {
      setDetectedWord(null);
      setConfidence(0);
    }

    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [hasPermission, detectionSpeed, activePackId, detectionMode, isModelReady]);

  useEffect(() => {
    if (!isDebugDialogOpen) {
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
  }, [isDebugDialogOpen]);

  const handleManualScan = async (overrideUri?: string | null, isManualClick: boolean = false) => {
    if (!activePackId) {
      if (isManualClick) Alert.alert("Lỗi", "Vui lòng chọn bộ từ vựng (Model) trước.");
      else setIsModelMenuOpen(true);
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
            }
            result = runDetection(imagePath);
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
      } else if (actualMedia && (detectionMode === 'picture' || detectionMode === 'video')) {
        let finalMedia = actualMedia;
        if (finalMedia && !finalMedia.startsWith('file://') && !finalMedia.startsWith('http') && finalMedia.startsWith('/')) {
          finalMedia = `file://${finalMedia}`;
        }
        result = runDetection(finalMedia);
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
    await handleManualScan(null, true);
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
      handleManualScan(savedUri, true);
    }
  };

  const pickModelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        if (result.assets[0].name.endsWith('.tflite')) {
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

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

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
              if (!granted) Linking.openSettings();
            }} style={{ borderRadius: 24 }}>
            Grant Permission / Open Settings
          </Button>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    triggerSelectionFeedback();
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    triggerSelectionFeedback();
    setFlash(!flash);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* 1. Top Options Bar */}
      <View style={styles.topBar}>
        <Menu
          visible={isModeMenuOpen}
          onDismiss={() => setIsModeMenuOpen(false)}
          anchor={
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsModeMenuOpen(true)}>
              {detectionMode === 'live' ? <CameraIcon color={theme.colors.primary} size={18} /> : 
               detectionMode === 'picture' ? <ImageIcon color={theme.colors.primary} size={18} /> :
               <VideoIcon color={theme.colors.primary} size={18} />}
              <Text style={styles.dropdownText}>{detectionMode.toUpperCase()}</Text>
              <ChevronDown color={theme.colors.onSurface} size={16} />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => { setDetectionMode('live'); setIsModeMenuOpen(false); setSelectedMedia(null); }} title="LIVE CAMERA" />
          <Menu.Item onPress={() => { setDetectionMode('picture'); setIsModeMenuOpen(false); setSelectedMedia(null); }} title="IMAGE UPLOAD" />
          <Menu.Item onPress={() => { setDetectionMode('video'); setIsModeMenuOpen(false); setSelectedMedia(null); }} title="VIDEO UPLOAD" />
        </Menu>

        <Menu
          visible={isModelMenuOpen}
          onDismiss={() => setIsModelMenuOpen(false)}
          anchor={
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsModelMenuOpen(true)}>
              <Brain color={activePackId ? theme.colors.primary : theme.colors.error} size={18} />
              <Text style={[styles.dropdownText, { maxWidth: 120 }]} numberOfLines={1}>
                {activePack ? activePack.name : (customModelUri ? 'Custom Model' : 'Select Model')}
              </Text>
              <ChevronDown color={theme.colors.onSurface} size={16} />
            </TouchableOpacity>
          }
        >
          {downloadedPacks.map(pack => (
            <Menu.Item 
              key={pack.id}
              onPress={() => { setActivePack(pack.id); setCustomModelUri(null); setIsModelMenuOpen(false); }}
              title={pack.name}
              trailingIcon={activePackId === pack.id && !customModelUri ? "check" : undefined}
            />
          ))}
          <Divider />
          <Menu.Item 
            onPress={() => { pickModelFile(); setIsModelMenuOpen(false); }}
            title="Load .tflite File"
            trailingIcon={customModelUri ? "check" : undefined}
          />
        </Menu>
      </View>

      {/* 2. Main Media View */}
      <View style={styles.mediaContainer}>
        {detectionMode === 'live' ? (
          <View style={styles.cameraWrapper}>
            {device != null ? (
              <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={true} torchMode={flash ? 'on' : 'off'} />
            ) : (
              <ActivityIndicator size="large" style={{ marginTop: 50 }} />
            )}
            {/* Scanning Reticle */}
            <View style={styles.reticleContainer} pointerEvents="none">
              <View style={styles.reticle}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {detectionSpeed !== 'off' && activePackId && (
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.uploadWrapper}>
            {selectedMedia ? (
              detectionMode === 'picture' ? (
                <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} resizeMode="contain" />
              ) : (
                <VideoView player={player} style={styles.mediaPreview} allowsPictureInPicture />
              )
            ) : (
              <View style={styles.emptyMedia}>
                <IconButton icon={detectionMode === 'picture' ? "image-plus" : "video-plus"} size={64} onPress={detectionMode === 'picture' ? pickImage : pickVideo} />
                <Text variant="bodyLarge">No Media Selected</Text>
              </View>
            )}
          </View>
        )}

        {/* Left Vertical Sidebar */}
        <View style={styles.verticalSidebar}>
          {detectionMode === 'live' ? (
            <>
              <Menu
                visible={isSpeedMenuOpen}
                onDismiss={() => setIsSpeedMenuOpen(false)}
                anchor={
                  <IconButton 
                    icon={
                      detectionSpeed === 'slow' ? 'turtle' :
                      detectionSpeed === 'fast' ? 'rabbit' :
                      detectionSpeed === 'off' ? 'motion-pause-outline' : 'walk'
                    } 
                    iconColor="white" 
                    size={24} 
                    style={styles.sideBtn} 
                    onPress={() => setIsSpeedMenuOpen(true)} 
                  />
                }
              >
                <Menu.Item onPress={() => { updateSettings({ detection: { speed: 'slow' } }); setIsSpeedMenuOpen(false); }} title="Slow (2.0s)" leadingIcon="turtle" />
                <Menu.Item onPress={() => { updateSettings({ detection: { speed: 'normal' } }); setIsSpeedMenuOpen(false); }} title="Normal (1.0s)" leadingIcon="walk" />
                <Menu.Item onPress={() => { updateSettings({ detection: { speed: 'fast' } }); setIsSpeedMenuOpen(false); }} title="Fast (0.5s)" leadingIcon="rabbit" />
                <Menu.Item onPress={() => { updateSettings({ detection: { speed: 'off' } }); setIsSpeedMenuOpen(false); }} title="Off (Manual)" leadingIcon="motion-pause-outline" />
              </Menu>
              <IconButton icon={() => <RotateCcw color="white" size={24} />} style={styles.sideBtn} onPress={toggleCameraFacing} />
              <IconButton icon={() => (flash ? <Zap color="#FFD600" size={24} /> : <ZapOff color="white" size={24} />)} style={styles.sideBtn} onPress={toggleFlash} />
              <IconButton icon={() => <Timer color="white" size={24} />} style={styles.sideBtn} onPress={() => Alert.alert('Countdown', 'Feature coming soon!')} />
            </>
          ) : (
            <IconButton icon={() => <FolderOpen color="white" size={24} />} style={styles.sideBtn} onPress={detectionMode === 'picture' ? pickImage : pickVideo} />
          )}
          
          {/* Manual Analyze Button */}
          <IconButton 
            icon="scan-helper" 
            containerColor={theme.colors.primary} 
            iconColor="white" 
            style={[styles.sideBtn, { marginTop: 20 }]} 
            onPress={onPressManualScan} 
            disabled={isProcessing || !activePackId || (detectionMode !== 'live' && !selectedMedia)}
          />
        </View>
      </View>

      {/* 3. Result Banner */}
      <View style={styles.resultBannerWrapper}>
        <Card style={styles.resultCard}>
          <View style={styles.resultContent}>
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={{ color: 'gray', textTransform: 'uppercase' }}>
                {activePack ? 'Live Detection Result' : 'System Idle'}
              </Text>
              <Text variant="displaySmall" style={{ fontWeight: '900', color: theme.colors.primary, marginTop: -4 }}>
                {activePack ? (detectedWord || '---') : 'Select Model'}
              </Text>
            </View>
            {activePack && detectedWord && (
              <View style={styles.confidenceCircle}>
                <Text style={styles.confidenceText}>{Math.round(confidence * 100)}%</Text>
              </View>
            )}
          </View>
        </Card>
      </View>

      {/* 4. Info Action Buttons */}
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

      {/* Dialogs */}
      <Portal>
        {/* History Dialog */}
        <Dialog visible={isHistoryDialogOpen} onDismiss={() => setIsHistoryDialogOpen(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>Detection History</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              {history.length > 0 ? (
                history.map((item, i) => (
                  <View key={item.id || i} style={styles.historyListItem}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.sign}</Text>
                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>{item.date} • {item.time}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No history recorded yet.</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsHistoryDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Pending Queue Dialog */}
        <Dialog visible={isDebugDialogOpen} onDismiss={() => setIsDebugDialogOpen(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>Hàng Đợi Xử Lý (Queue)</Dialog.Title>
          <Dialog.Content>
            {debugData ? (
              <ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Badge size={12} style={{ backgroundColor: debugData.isProcessing ? theme.colors.error : theme.colors.primary, marginRight: 8 }} />
                  <Text variant="titleMedium">Trạng thái: <Text style={{ fontWeight: 'bold' }}>{debugData.isProcessing ? 'ĐANG XỬ LÝ' : 'RẢNH RỖI'}</Text></Text>
                </View>

                {debugData.isProcessing && debugData.processingItem && (
                  <View style={{ padding: 12, backgroundColor: theme.colors.primaryContainer, borderRadius: 8, marginBottom: 16 }}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, marginBottom: 4 }}>► Đang tính toán:</Text>
                    <Text variant="bodySmall" style={{ fontFamily: 'monospace' }} numberOfLines={1}>
                      {debugData.processingItem.split('/').pop()}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text variant="labelLarge">Đang chờ (Pending):</Text>
                  <Text variant="labelMedium">{debugData.queueLength} / 10</Text>
                </View>
                
                <Divider style={{ marginBottom: 8 }} />

                {debugData.queue.length > 0 ? (
                  debugData.queue.map((q, i) => (
                    <View key={i} style={{ padding: 8, backgroundColor: theme.colors.surfaceVariant, marginBottom: 4, borderRadius: 8 }}>
                      <Text variant="bodySmall" style={{ fontFamily: 'monospace' }} numberOfLines={1}>
                        #{i+1} - {q.split('/').pop()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="bodyMedium" style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>Không có ảnh nào chờ.</Text>
                )}
              </ScrollView>
            ) : (
              <ActivityIndicator size="large" style={{ margin: 20 }} />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDebugDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={2000}
        style={{ marginBottom: 20 }}
      >
        {snackbarMsg}
      </Snackbar>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100,100,100,0.2)',
  },
  dropdownText: {
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  mediaContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  cameraWrapper: {
    flex: 1,
  },
  uploadWrapper: {
    flex: 1,
  },
  mediaPreview: {
    flex: 1,
  },
  emptyMedia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalSidebar: {
    position: 'absolute',
    left: 10,
    top: '20%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  sideBtn: {
    marginVertical: 4,
  },
  resultBannerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  resultCard: {
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  confidenceCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  confidenceText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#2E7D32',
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
  historyListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reticleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: '100%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});
