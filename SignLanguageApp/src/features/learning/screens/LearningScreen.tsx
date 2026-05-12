import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, ProgressBar, useTheme } from 'react-native-paper';
import { useLearningStore } from '../store/useLearningStore';
import { triggerSelectionFeedback, triggerSuccessFeedback } from '../../../utils/feedback';
import WordChip from '../components/WordChip';

export default function LearningScreen() {
  const theme = useTheme();
  const { words, progress, toggleFavorite, markLearned } = useLearningStore();

  const handleToggleFavorite = (id: string) => {
    triggerSelectionFeedback();
    toggleFavorite(id);
  };

  const handleMarkLearned = (id: string, learned: boolean) => {
    if (learned) triggerSuccessFeedback();
    else triggerSelectionFeedback();
    markLearned(id, learned);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium">ASL Basics Pack</Text>
        <Text variant="bodyMedium">Progress: {Math.round(progress * 100)}%</Text>
        <ProgressBar progress={progress} style={styles.progressBar} color={theme.colors.primary} />
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Vocabulary</Text>
        <View style={styles.chipContainer}>
          {words.map((w) => (
            <WordChip 
              key={w.id} 
              word={w} 
              onToggleFavorite={handleToggleFavorite} 
              onMarkLearned={handleMarkLearned} 
            />
          ))}
        </View>
        <Text variant="bodySmall" style={styles.hint}>Tap to star, long press to mark learned.</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Practice & Test</Text>
        <Card style={styles.card} mode="elevated">
          <Card.Title title="Interactive Learning" subtitle="Learn new signs step-by-step" />
          <Card.Actions>
            <Button mode="contained">Start Learning</Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Title title="Time Attack" subtitle="Sign as many words as possible in 60s" />
          <Card.Actions>
            <Button mode="outlined">Start Test</Button>
          </Card.Actions>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  progressBar: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hint: {
    marginTop: 8,
    color: 'gray',
  },
  card: {
    marginBottom: 16,
  },
});
