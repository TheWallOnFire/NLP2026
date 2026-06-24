import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { CheckCircle, Camera as CameraIcon, SkipForward } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button, useTheme, Card, Appbar, IconButton, Snackbar, ActivityIndicator } from 'react-native-paper';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLearningStore } from '../store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';
import DebugOverlay from '../../detection/components/DebugOverlay';

export default function PracticeScreen({ route, navigation }: any) {
  const { packId, wordId } = route.params || {};
  const theme = useTheme();
  
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const markLearned = useLearningStore(state => state.markLearned);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceWords, setPracticeWords] = useState<any[]>([]);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(facing);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState<"default" | "green" | "red">("default");
  const thresholdValue = useSettingsStore(state => state.detection?.threshold || 0.5);
  const latestDetection = useRef<{wordStr: string, conf: number} | null>(null);

  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);


  useEffect(() => {
    if (words.length > 0 && practiceWords.length === 0) {
      let sorted;
      if (wordId) {
        // If a specific word was selected, put it first
        const specificWord = words.find(w => w.id === wordId);
        const others = words.filter(w => w.id !== wordId);
        sorted = specificWord ? [specificWord, ...others] : others;
      } else {
        sorted = words.filter(w => !w.learned).concat(words.filter(w => w.learned));
      }
      setPracticeWords(sorted);
    }
  }, [words, practiceWords.length, wordId]);

  const currentWord = practiceWords[currentIndex];

  const cameraRef = useRef<any>(null);

  const handleSkip = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % practiceWords.length);
  }, [practiceWords.length]);

  const evaluateDetection = useCallback(() => {
    if (!currentWord) return;
    const det = latestDetection.current;
    
    if (det && det.wordStr === currentWord.word && det.conf >= thresholdValue) {
      setSnackbarColor("green");
      setSnackbarMsg(`Chính xác! (${Math.round(det.conf * 100)}%)`);
      triggerSuccessFeedback();
      markLearned(packId, currentWord.id, true);
      setTimeout(() => {
        handleSkip();
      }, 1000);
    } else {
      setSnackbarColor("red");
      setSnackbarMsg(`Chưa chính xác! Nhận diện được: ${det?.wordStr || 'Không rõ'} (${Math.round((det?.conf || 0) * 100)}%)`);
    }
  }, [currentWord, thresholdValue, packId, markLearned, handleSkip]);

  const handleDetection = useCallback((index: number, conf: number) => {
    if (!currentWord) return;
    const detectedWordStr = words[index]?.word;
    latestDetection.current = { wordStr: detectedWordStr, conf };
  }, [currentWord, words]);

  const { isModelReady, runDetection, getDebugInfo } = useSignLanguageModel(handleDetection);

  const checkFromCamera = async () => {
    if (!cameraRef.current || !isModelReady) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 85 });
      let imagePath = photo?.path || (typeof photo.saveToTemporaryFileAsync === 'function' && await photo.saveToTemporaryFileAsync('jpg', 85)) || photo?.uri || (typeof photo === 'string' ? photo : undefined);
      
      if (imagePath && !imagePath.startsWith('file://') && !imagePath.startsWith('http') && imagePath.startsWith('/')) {
        imagePath = `file://${imagePath}`;
      }

      if (imagePath) {
        latestDetection.current = null;
        await runDetection(imagePath, facing, true);
        
        let attempts = 0;
        await new Promise(r => setTimeout(r, 300)); // wait for queue to pick up
        while (getDebugInfo().isProcessing && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        await new Promise(r => setTimeout(r, 100)); // padding for handleDetection
        evaluateDetection();
      }
    } catch (e) {
      console.warn("Camera snapshot failed", e);
      setSnackbarColor("red");
      setSnackbarMsg("Không thể chụp ảnh từ Camera!");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const devMode = useSettingsStore.getState().developerDebugMode;
    if (devMode) {
      const interval = setInterval(() => {
        setDebugData(getDebugInfo());
      }, 500);
      return () => clearInterval(interval);
    }
  }, [getDebugInfo]);

  const pickImageForDetection = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessing(true);
        const sourceUri = result.assets[0].uri;
        latestDetection.current = null;
        await runDetection(sourceUri);
        
        let attempts = 0;
        await new Promise(r => setTimeout(r, 300));
        while (getDebugInfo().isProcessing && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        await new Promise(r => setTimeout(r, 100));
        evaluateDetection();
        setIsProcessing(false);
      }
    } catch (e) {
      console.warn("Failed to pick image", e);
      setIsProcessing(false);
    }
  };

  if (!currentWord) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium">No words to practice!</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          Go Back
        </Button>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>We need camera permission to practice.</Text>
        <Button mode="contained" onPress={async () => await requestPermission()}>Grant Permission</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`Practice: ${currentWord.word}`} />
        <Appbar.Action icon="bug" onPress={() => { setDebugData(getDebugInfo()); setIsDebugDialogOpen(true); }} />
      </Appbar.Header>

      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.wordTitle}>{currentWord.word}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>Word {currentIndex + 1} of {practiceWords.length}</Text>
        </View>
      </View>

      <Card style={styles.card} mode="elevated">
        <Image 
          key={currentWord.id}
          source={{ uri: `${FileSystem.documentDirectory}packs/${packId}/word_images/${currentWord.word}.png` }} 
          style={{ width: '100%', height: 220 }}
          resizeMode="contain"
        />
      </Card>

      <View style={styles.cameraWrapper}>
        <LinearGradient 
          colors={['#ff9a9e', '#fecfef']} 
          style={StyleSheet.absoluteFill} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cameraContainer}>
          {device != null && (
            <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} />
          )}

          <View style={styles.boundingBoxContainer} pointerEvents="none">
            <View style={styles.boundingBox} />
          </View>
          
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.cameraTopOverlay}
          />

          <IconButton 
            icon="camera-flip" 
            iconColor="white"
            size={24}
            style={styles.flipButton}
            onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}
          />
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>Live Feed</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          <Button 
            mode="contained-tonal" 
            onPress={pickImageForDetection} 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
            disabled={isProcessing || !isModelReady}
            icon="image"
          >
            Ảnh
          </Button>

          <Button 
            mode="contained" 
            onPress={checkFromCamera} 
            style={[styles.actionButton, { flex: 1 }]}
            buttonColor={theme.colors.primary}
            disabled={isProcessing || !isModelReady}
            icon={() => <CheckCircle size={20} color="white" />}
          >
            Kiểm tra
          </Button>

          <Button 
            mode="outlined" 
            onPress={handleSkip} 
            style={styles.actionButton}
            icon={() => <SkipForward size={20} color={theme.colors.primary} />}
          >
            Bỏ qua
          </Button>
        </View>
        {isProcessing && (
          <View style={{ position: 'absolute', top: -50, alignSelf: 'center', backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 4 }}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={1500}
        style={{ 
          marginBottom: 20, 
          backgroundColor: snackbarColor === "green" ? "#4CAF50" : snackbarColor === "red" ? "#F44336" : theme.colors.elevation.level3
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{snackbarMsg}</Text>
      </Snackbar>

      <DebugOverlay 
        debugData={debugData} 
        activePackWords={words.map(w => w.word)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 12,
  },
  wordTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 10,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 4, // Gradient border width
    elevation: 8,
    shadowColor: '#ff9a9e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  cameraTopOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
  },
  boundingBoxContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boundingBox: {
    width: 224,
    height: 224,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  flipButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    borderRadius: 16,
    elevation: 2,
    justifyContent: 'center',
  },
});
