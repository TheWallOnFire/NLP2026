import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
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
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [testActive, setTestActive] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(facing);

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
        sign: `${pack?.name || 'Test'} Score: ${score}`,
        date: new Date().toISOString(),
        time: new Date().toISOString(),
        type: 'test',
      });
    }
  }, [timeLeft, testActive, score, addHistoryItem, pack]);

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
    
    if (detectedWordStr === currentWord.word && conf > 0.8) {
      handleSimulateCorrect();
    }
  }, [testActive, currentWord, words, handleSimulateCorrect]);

  const { isModelReady } = useSignLanguageModel(handleDetection);



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
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
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
        <Button mode="outlined" onPress={handleSimulateSkip} style={styles.actionButton}>
          Skip
        </Button>
        <Button mode="contained" onPress={handleSimulateCorrect} style={styles.actionButton} buttonColor={theme.colors.primary}>
          Correct
        </Button>
      </View>
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
