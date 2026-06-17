import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { CheckCircle, Camera as CameraIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button, useTheme, Card, Appbar, IconButton } from 'react-native-paper';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import * as FileSystem from 'expo-file-system/legacy';
import { useLearningStore } from '../store/useLearningStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';

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
  const [imageError, setImageError] = useState(false);

  // Reset image error when word changes
  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  // Initialize practice words once they are available
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

  const handleSimulateDetection = useCallback(() => {
    if (!currentWord) return;
    
    triggerSuccessFeedback();
    markLearned(packId, currentWord.id, true);

    // Go to next word or wrap around
    setCurrentIndex((prev) => (prev + 1) % practiceWords.length);
  }, [currentWord, markLearned, packId, practiceWords.length]);

  const handleDetection = useCallback((index: number, conf: number) => {
    if (!currentWord) return;
    const detectedWordStr = words[index]?.word;
    
    // If the detected word matches the word we are practicing, and confidence is high
    if (detectedWordStr === currentWord.word && conf > 0.8) {
      handleSimulateDetection();
    }
  }, [currentWord, words, handleSimulateDetection]);

  const { isModelReady } = useSignLanguageModel(handleDetection);

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
      </Appbar.Header>

      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.wordTitle}>{currentWord.word}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>Word {currentIndex + 1} of {practiceWords.length}</Text>
        </View>
      </View>

      <Card style={styles.card} mode="elevated">
        <View style={styles.placeholderImage}>
          {!imageError ? (
            <Image 
              key={currentWord.id}
              source={{ uri: `${FileSystem.documentDirectory}packs/${packId}/word_images/${currentWord.word}.png` }} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <CameraIcon size={48} color="rgba(0,0,0,0.2)" />
              <Text variant="bodyLarge" style={{ color: 'gray', marginTop: 12 }}>Sign: "{currentWord.word}"</Text>
            </View>
          )}
        </View>
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
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
          )}
          
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
        <Button 
          mode="contained" 
          onPress={handleSimulateDetection} 
          style={styles.simulateButton}
          contentStyle={{ paddingVertical: 8 }}
          buttonColor={theme.colors.primary}
          icon={() => <CheckCircle size={20} color="white" />}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>Success Detection</Text>
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
  simulateButton: {
    borderRadius: 100,
    elevation: 4,

    padding: 8,
  },
});
