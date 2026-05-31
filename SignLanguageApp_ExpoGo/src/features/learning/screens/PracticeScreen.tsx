import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Card, Appbar } from 'react-native-paper';
import { useLearningStore } from '../store/useLearningStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';

export default function PracticeScreen({ route, navigation }: any) {
  const { packId } = route.params || {};
  const theme = useTheme();
  
  const words = useLearningStore(state => state.packWords[packId] || []);
  const markLearned = useLearningStore(state => state.markLearned);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceWords, setPracticeWords] = useState<any[]>([]);

  // Initialize practice words once they are available
  React.useEffect(() => {
    if (words.length > 0 && practiceWords.length === 0) {
      const sorted = words.filter(w => !w.learned).concat(words.filter(w => w.learned));
      setPracticeWords(sorted);
    }
  }, [words, practiceWords.length]);
  
  const currentWord = practiceWords[currentIndex];

  const handleSimulateDetection = () => {
    if (!currentWord) return;
    
    triggerSuccessFeedback();
    markLearned(packId, currentWord.id, true);

    // Go to next word or wrap around
    setCurrentIndex((prev) => (prev + 1) % practiceWords.length);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`Practice: ${currentWord.word}`} />
      </Appbar.Header>

      <View style={styles.header}>
        <Text variant="headlineMedium">{currentWord.word}</Text>
        <Text variant="bodyMedium">Step {currentIndex + 1} of {practiceWords.length}</Text>
      </View>

      <Card style={styles.card} mode="outlined">
        <View style={styles.placeholderImage}>
          <Text variant="bodyLarge">[ Tutorial for "{currentWord.word}" ]</Text>
        </View>
      </Card>

      <View style={styles.cameraPlaceholder}>
        <Text variant="bodyLarge" style={{ color: 'white' }}>[ Camera Feed Here ]</Text>
      </View>

      <Button 
        mode="contained" 
        onPress={handleSimulateDetection} 
        style={styles.simulateButton}
        icon="camera-check"
      >
        Simulate Detection Success
      </Button>
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
    padding: 20,
  },
  card: {
    margin: 16,
    height: 200,
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cameraPlaceholder: {
    flex: 1,
    margin: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  simulateButton: {
    margin: 16,
    marginBottom: 32,
    padding: 8,
  },
});
