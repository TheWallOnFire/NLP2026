import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Linking, Animated, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Text, Button, useTheme, IconButton, Card, Badge, ActivityIndicator } from 'react-native-paper';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../hooks/useSignLanguageModel';
import { triggerSelectionFeedback, triggerImpactFeedback } from '../../../utils/feedback';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ChevronDown, History as HistoryIcon, Zap, ZapOff, Maximize, Brain, FileBox } from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Speech from 'expo-speech';

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

  const { isModelReady } = useSignLanguageModel(handleDetection);
  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [detectionSpeed, setDetectionSpeed] = useState<'slow' | 'normal' | 'fast' | 'off'>('normal');
  const [detectionMode, setDetectionMode] = useState<'live' | 'picture' | 'video'>('live');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const player = useVideoPlayer(detectionMode === 'video' ? selectedMedia : null, player => {
    if (player) {
      player.loop = true;
      player.play();
    }
  });

  const scanAnim = useRef(new Animated.Value(0)).current;



  // Immersive Mode
  useEffect(() => {
    navigation.setOptions({
      autoHideHomeIndicator: true,
    });
  }, [navigation]);

  const getInterval = () => {
    switch (detectionSpeed) {
      case 'slow': return 3000;
      case 'normal': return 1000;
      case 'fast': return 100;
      case 'off': return -1;
      default: return 1000;
    }
  };

  useEffect(() => {
    if (hasPermission && detectionSpeed !== 'off' && activePackId && detectionMode === 'live') {
      // Start scanning animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      setDetectedWord(null);
      setConfidence(0);
    }
  }, [hasPermission, detectionSpeed, activePackId, detectionMode]);

  const handleManualScan = () => {
    if (!activePackId) {
      Alert.alert("Model Required", "Please select a model pack first.");
      setIsModelMenuOpen(true);
      return;
    }
    setIsProcessing(true);
    triggerImpactFeedback();
    
    // In a full implementation without frame processors, we would process selectedMedia here.
    // For now, we mock it for image/video manual scans
    const words = packWords[activePackId]?.map(w => w.word) || [];
    setTimeout(() => {
      if (words.length > 0) {
        setDetectedWord(words[Math.floor(Math.random() * words.length)]);
        setConfidence(0.85 + Math.random() * 0.14);
      }
      setIsProcessing(false);
    }, 800);
  };

  // Mock function to represent capturing the bounding box area
  const captureBoundingBoxAndAnalyze = async () => {
    // In a full implementation, we will pass cropped frame buffers directly to fast-tflite
    console.log("Analyzing bounding box natively...");
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
      handleManualScan();
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
      handleManualScan();
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
          <Button
            mode="contained"
            onPress={async () => {
              const granted = await requestPermission();
              if (!granted) Linking.openSettings();
            }}
            style={styles.button}
          >
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Half: Mode-Specific View */}
      <View style={styles.cameraHalf}>
        {/* Mode Selector Tabs */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.5)', 'transparent']}
          style={styles.modeTabBar}
        >
          {(['live', 'picture', 'video'] as const).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeTab, detectionMode === mode && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]}
              onPress={() => {
                setDetectionMode(mode);
                setSelectedMedia(null);
                setDetectedWord(null);
                triggerSelectionFeedback();
              }}
            >
              <Text style={[styles.modeTabText, detectionMode === mode && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </LinearGradient>

        {detectionMode === 'live' ? (
          <View style={styles.camera}>
            {device != null ? (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                torchMode={flash ? 'on' : 'off'}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }]}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ color: 'white', marginTop: 10 }}>Loading Camera...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mediaContainer}>
            {selectedMedia ? (
              detectionMode === 'picture' ? (
                <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} resizeMode="contain" />
              ) : (
                <VideoView
                  player={player}
                  style={styles.mediaPreview}
                  allowsPictureInPicture
                />
              )
            ) : (
              <View style={styles.emptyMedia}>
                <IconButton
                  icon={detectionMode === 'picture' ? "image-plus" : "video-plus"}
                  size={64}
                  onPress={detectionMode === 'picture' ? pickImage : pickVideo}
                />
                <Text variant="bodyLarge">Select a {detectionMode} to analyze</Text>
                <Button mode="outlined" style={{ marginTop: 12 }} onPress={detectionMode === 'picture' ? pickImage : pickVideo}>
                  Browse Files
                </Button>
              </View>
            )}
          </View>
        )}

        {/* Top Controls Overlay */}
        <View style={styles.topControls}>
          <View style={styles.glassHeader}>
            {detectionMode === 'live' && (
              <IconButton icon="camera-flip" iconColor="white" size={20} onPress={toggleCameraFacing} style={styles.controlBtn} />
            )}
            <TouchableOpacity style={styles.modelIndicator} onPress={() => setIsModelMenuOpen(true)}>
              <Brain color={activePack ? theme.colors.primary : 'white'} size={18} />
              <Text style={[styles.statusText, { marginLeft: 6 }]} numberOfLines={1}>
                {activePack ? activePack.name : 'Select Model'}
              </Text>
              <ChevronDown color="white" size={14} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            {detectionMode === 'live' && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.statusIndicator} onPress={() => setIsSpeedMenuOpen(true)}>
                  <View style={[styles.pulseDot, { backgroundColor: detectionSpeed === 'off' ? theme.colors.error : '#4CAF50' }]} />
                  <Text style={styles.statusText}>{detectionSpeed === 'off' ? 'MANUAL' : detectionSpeed.toUpperCase()}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Vision Sidebar (for flash/change media) */}
        <View style={styles.sideToolbar}>
          {detectionMode === 'live' && (
            <IconButton icon="flash" iconColor={flash ? "#FFD600" : "white"} size={18} style={styles.sideBtn} onPress={toggleFlash} />
          )}
          {detectionMode !== 'live' && (
            <IconButton icon="folder-open" iconColor="white" size={18} style={styles.sideBtn} onPress={detectionMode === 'picture' ? pickImage : pickVideo} />
          )}
          {selectedMedia && (
            <IconButton icon="refresh" iconColor="white" size={18} style={styles.sideBtn} onPress={handleManualScan} />
          )}
        </View>

        {/* Scanning Reticle (Only for live/picture) */}
        {detectionMode !== 'video' && (
          <View style={styles.reticleContainer} pointerEvents="none">
            <View style={styles.reticle}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {(detectionMode === 'live' ? detectionSpeed !== 'off' : !!selectedMedia) && activePackId && (
                <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
              )}
            </View>
          </View>
        )}

        {/* Manual/Action Button */}
        {(detectionSpeed === 'off' || detectionMode !== 'live') && (
          <View style={styles.manualTriggerContainer}>
            <Button
              mode="contained"
              loading={isProcessing}
              onPress={handleManualScan}
              style={styles.manualBtn}
              icon="scan-helper"
              compact
              disabled={!activePack || (detectionMode !== 'live' && !selectedMedia)}
            >
              {detectionMode === 'live' ? 'Scan' : 'Analyze'}
            </Button>
          </View>
        )}
      </View>

      {/* Bottom Half: Output List */}
      <View style={styles.listHalf}>
        {/* Current Result Banner (Moved here) */}
        <View style={styles.resultContainer}>
          <Card style={styles.bannerCard}>
            <View style={styles.bannerContent}>
              <View style={{ flex: 1 }}>
                <Text variant="labelSmall" style={{ color: 'gray' }}>{activePack ? 'Currently Detecting' : 'System Idle'}</Text>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                  {activePack ? (detectedWord || 'Waiting...') : 'Select a Model'}
                </Text>
              </View>
              {activePack && detectedWord && (
                <View style={styles.confBadgeInline}>
                  <Text style={styles.confTextInline}>{Math.round(confidence * 100)}% Match</Text>
                </View>
              )}
            </View>
          </Card>
        </View>

        <View style={styles.listHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HistoryIcon size={18} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleSmall" style={{ marginLeft: 8, fontWeight: 'bold', opacity: 0.7 }}>Live Output History</Text>
          </View>
          <Text variant="labelSmall" style={{ opacity: 0.4 }}>{history.length} signs</Text>
        </View>

        <ScrollView style={styles.historyScroll} contentContainerStyle={{ paddingBottom: 20 }}>
          {history.length > 0 ? (
            history.map((item, i) => (
              <Card key={item.id || i} style={styles.outputItem} mode="elevated">
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.historyIconContainer}>
                    <Text style={{ fontSize: 24 }}>✨</Text>
                  </View>
                  <View style={styles.outputInfo}>
                    <Text variant="titleMedium" style={styles.outputSign}>{item.sign}</Text>
                    <Text variant="bodySmall" style={styles.outputMeta}>{item.date} • {item.time}</Text>
                  </View>
                  <Badge style={styles.outputBadge}>{item.type.toUpperCase()}</Badge>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyOutput}>
              <ActivityIndicator size={24} style={{ marginBottom: 12 }} />
              <Text variant="bodyMedium" style={{ opacity: 0.5 }}>Waiting for detection...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {isModelMenuOpen && (
        <View style={styles.speedOverlay}>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium" style={{ color: 'white' }}>Select Active Model</Text>
            <IconButton icon="close" iconColor="white" size={20} onPress={() => setIsModelMenuOpen(false)} />
          </View>
          <ScrollView style={{ maxHeight: 200 }}>
            {downloadedPacks.map(pack => (
              <TouchableOpacity
                key={pack.id}
                style={[styles.modelOption, activePackId === pack.id && !customModelUri && { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => { setActivePack(pack.id); setCustomModelUri(null); setIsModelMenuOpen(false); }}
              >
                <Text style={[styles.modelOptionText, activePackId === pack.id && !customModelUri && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                  {pack.name}
                </Text>
                {activePackId === pack.id && !customModelUri && <IconButton icon="check" size={16} iconColor={theme.colors.primary} />}
              </TouchableOpacity>
            ))}

            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }}>
              <TouchableOpacity
                style={[styles.modelOption, customModelUri && { backgroundColor: theme.colors.secondaryContainer }]}
                onPress={() => { pickModelFile(); setIsModelMenuOpen(false); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FileBox size={18} color={customModelUri ? theme.colors.secondary : 'white'} style={{ marginRight: 8 }} />
                  <Text style={[styles.modelOptionText, customModelUri && { color: theme.colors.secondary, fontWeight: 'bold' }]}>
                    Load Custom .tflite File
                  </Text>
                </View>
                {customModelUri && <IconButton icon="check" size={16} iconColor={theme.colors.secondary} />}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {isSpeedMenuOpen && (
        <View style={styles.speedOverlay}>
          <View style={styles.historyHeader}>
            <Text variant="titleSmall" style={{ color: 'white' }}>Detection Speed</Text>
            <IconButton icon="close" iconColor="white" size={20} onPress={() => setIsSpeedMenuOpen(false)} />
          </View>
          <View style={styles.speedOptions}>
            {(['slow', 'normal', 'fast', 'off'] as const).map((s) => (
              <Button
                key={s}
                mode={detectionSpeed === s ? "contained" : "text"}
                onPress={() => { setDetectionSpeed(s); setIsSpeedMenuOpen(false); }}
                compact
                style={styles.speedBtn}
              >
                {s.toUpperCase()}
              </Button>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHalf: {
    flex: 2,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#000',
  },
  listHalf: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  modeTabBar: {
    flexDirection: 'row',
    paddingTop: 45, // Account for status bar
    paddingBottom: 5,
    zIndex: 20,
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  modeTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    letterSpacing: 1,
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  emptyMedia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 105,
    left: 15,
    right: 15,
    zIndex: 10,
  },
  glassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlBtn: {
    margin: 0,
  },
  modelIndicator: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  statusIndicator: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sideToolbar: {
    position: 'absolute',
    right: 15,
    top: 120,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  sideBtn: {
    margin: 2,
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
    borderWidth: 2,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: '100%',
  },
  resultContainer: {
    paddingHorizontal: 20,
    marginTop: -10, // Slight overlap for depth
    marginBottom: 15,
  },
  bannerCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
  },
  confBadgeInline: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confTextInline: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  manualTriggerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  manualBtn: {
    borderRadius: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  historyScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  outputItem: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  outputInfo: {
    flex: 1,
  },
  outputSign: {
    fontWeight: '900',
  },
  outputMeta: {
    marginTop: 4,
  },
  outputBadge: {
    backgroundColor: '#E8EAF6',
    color: '#3F51B5',
    fontWeight: 'bold',
  },
  emptyOutput: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  speedOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 20,
    padding: 20,
    zIndex: 100,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  speedOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  speedBtn: {
    flex: 1,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
  },
  modelOptionText: {
    color: 'white',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontWeight: 'bold',
    marginVertical: 10,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    width: '100%',
  },
});
