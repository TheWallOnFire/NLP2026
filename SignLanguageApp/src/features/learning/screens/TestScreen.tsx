import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, IconButton, Snackbar, ActivityIndicator } from 'react-native-paper';
import { CheckCircle } from 'lucide-react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import { useLearningStore } from '../store/useLearningStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../store/useModelStore';
import { triggerSuccessFeedback, triggerErrorFeedback } from '../../../utils/feedback';

export default function TestScreen({ route, navigation }: any) {
  const { packId, duration, mode } = route.params || {};
  const theme = useTheme();
  
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);
  const packs = useModelStore(state => state.packs);
  
  const pack = packs.find(p => p.id === packId);

  const [timeLeft, setTimeLeft] = useState(duration || 60);
  const [score, setScore] = useState(0);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [testActive, setTestActive] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(facing);
  const cameraRef = React.useRef<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState<"green" | "red">("green");

  const latestDetection = React.useRef<{wordStr: string, conf: number} | null>(null);

  // Initialize test once words are available
  useEffect(() => {
    if (words.length > 0 && !currentWord) {
      setCurrentWord(words[Math.floor(Math.random() * words.length)]);
      setTestActive(true);
    }
  }, [words, currentWord]);

  if (words.length === 0 && !testActive) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium">Loading Test...</Text>
        <Text variant="bodyMedium">Setting up your session</Text>
      </View>
    );
  }

  if (words.length === 0 && testActive) {
    // This case should theoretically not happen with the logic above, but good for safety
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium">No words available!</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          Go Back
        </Button>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>We need camera permission for the test.</Text>
        <Button mode="contained" onPress={async () => await requestPermission()}>Grant Permission</Button>
      </View>
    );
  }

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && testActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, testActive]);

  // End of test logic
  useEffect(() => {
    if (timeLeft === 0 && testActive) {
      setTestActive(false);
      
      addHistoryItem({
        sign: `Bài kiểm tra: ${pack?.name || 'Gói từ'}`,
        signs: correctWords,
        date: new Date().toLocaleDateString('vi-VN'),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        type: 'test',
      });
    }
  }, [timeLeft, testActive, score, correctWords, addHistoryItem, pack]);

  const handleSimulateCorrect = React.useCallback(() => {
    if (!testActive) return;
    triggerSuccessFeedback();
    setScore(prev => prev + 1);
    nextWord();
  }, [testActive]);

  const handleSimulateSkip = () => {
    if (!testActive) return;
    triggerErrorFeedback();
    nextWord();
  };

  const nextWord = () => {
    if (words.length <= 1) return;
    
    let randomWord;
    do {
      randomWord = words[Math.floor(Math.random() * words.length)];
    } while (currentWord && randomWord.id === currentWord.id);
    
    setCurrentWord(randomWord);
  };

  const handleDetection = React.useCallback((index: number, conf: number) => {
    if (!testActive || !currentWord) return;
    const detectedWordStr = words[index]?.word;
    latestDetection.current = { wordStr: detectedWordStr, conf };
  }, [testActive, currentWord, words]);

  const { isModelReady, runDetection, getDebugInfo } = useSignLanguageModel(handleDetection);

  const evaluateDetection = React.useCallback(() => {
    if (!currentWord) return;
    const det = latestDetection.current;
    
    // Test mode requires high confidence
    if (det && det.wordStr === currentWord.word && det.conf >= 0.7) {
      setSnackbarColor("green");
      setSnackbarMsg(`Chính xác! (${Math.round(det.conf * 100)}%)`);
      triggerSuccessFeedback();
      setScore(prev => prev + 1);
      setCorrectWords(prev => [...prev, currentWord.word]);
      setTimeout(() => {
        nextWord();
      }, 500);
    } else {
      setSnackbarColor("red");
      setSnackbarMsg(`Chưa chính xác! Nhận diện được: ${det?.wordStr || 'Không rõ'} (${Math.round((det?.conf || 0) * 100)}%)`);
      triggerErrorFeedback();
    }
  }, [currentWord]);

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
        await new Promise(r => setTimeout(r, 300)); // Wait for queue to pick up
        while (getDebugInfo().isProcessing && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        await new Promise(r => setTimeout(r, 100)); // Padding for handleDetection
        evaluateDetection();
      }
    } catch (e) {
      console.warn("Camera snapshot failed in test", e);
      setSnackbarColor("red");
      setSnackbarMsg("Không thể chụp ảnh từ Camera!");
    } finally {
      setIsProcessing(false);
    }
  };



  if (!testActive) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="displaySmall" style={styles.scoreText}>Test Finished!</Text>
        <Text variant="headlineMedium">Final Score: {score}</Text>
        <Text variant="bodyMedium" style={{ marginTop: 8 }}>
          Mode: {(mode || 'random').toUpperCase()} | Duration: {duration || 60}s
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 32 }}>
          Back to Pack
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: timeLeft <= 10 ? 'red' : theme.colors.onBackground }}>
          {timeLeft}s
        </Text>
        <Text variant="headlineMedium">Score: {score}</Text>
      </View>

      <View style={styles.wordContainer}>
        <Text variant="displayLarge">{currentWord?.word}</Text>
        <Text variant="bodyLarge">Sign this!</Text>
      </View>

      <View style={styles.cameraPlaceholder}>
        {device != null ? (
          <View style={{ flex: 1, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
            <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} />
            <IconButton 
              icon="camera-flip" 
              iconColor="white"
              size={24}
              style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.2)' }}
              onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}
            />
          </View>
        ) : (
          <Text variant="bodyLarge" style={{ color: 'white' }}>Loading Camera...</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button 
          mode="outlined" 
          onPress={handleSimulateSkip} 
          style={styles.actionButton}
          disabled={isProcessing}
        >
          Bỏ qua
        </Button>
        <Button 
          mode="contained" 
          onPress={checkFromCamera} 
          style={styles.actionButton} 
          buttonColor={theme.colors.primary}
          disabled={isProcessing || !isModelReady}
          icon={() => isProcessing ? <ActivityIndicator size={20} color="white" /> : <CheckCircle size={20} color="white" />}
        >
          Kiểm tra
        </Button>
      </View>

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={2000}
        style={{ backgroundColor: snackbarColor === "green" ? "#4CAF50" : "#F44336" }}
        action={{
          label: 'OK',
          textColor: 'white',
          onPress: () => setSnackbarMsg(""),
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{snackbarMsg}</Text>
      </Snackbar>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  wordContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    margin: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 8,
  },
  scoreText: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
});
