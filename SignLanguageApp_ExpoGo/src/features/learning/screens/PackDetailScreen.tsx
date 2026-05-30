import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, ProgressBar, useTheme, Appbar } from 'react-native-paper';
import { useLearningStore } from '../store/useLearningStore';
import { useModelStore } from '../store/useModelStore';
import { triggerSelectionFeedback, triggerSuccessFeedback } from '../../../utils/feedback';
import WordChip from '../components/WordChip';
import { ROUTES } from '../../../constants/routes';

export default function PackDetailScreen({ route, navigation }: any) {
  const { packId } = route.params || {};
  const theme = useTheme();
  
  const words = useLearningStore(state => state.packWords[packId] || []);
  const toggleFavorite = useLearningStore(state => state.toggleFavorite);
  const markLearned = useLearningStore(state => state.markLearned);
  
  const packs = useModelStore(state => state.packs);
  const pack = packs.find(p => p.id === packId);

  const progress = words.length > 0 ? words.filter(w => w.learned).length / words.length : 0;

  const handleToggleFavorite = (wordId: string) => {
    triggerSelectionFeedback();
    toggleFavorite(packId, wordId);
  };

  const handleMarkLearned = (wordId: string, learned: boolean) => {
    if (learned) triggerSuccessFeedback();
    else triggerSelectionFeedback();
    markLearned(packId, wordId, learned);
  };

  if (!pack) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={pack.name} />
      </Appbar.Header>
      
      <ScrollView>
        <View style={[styles.header, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="headlineMedium">{pack.name}</Text>
          <Text variant="bodyMedium">Progress: {Math.round((progress || 0) * 100)}%</Text>
          <ProgressBar progress={progress || 0} style={styles.progressBar} color={theme.colors.primary} />
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Vocabulary</Text>
          <View style={styles.chipContainer}>
            {words.map((w) => (
              <WordChip 
                key={w.id} 
                word={w} 
                onToggleFavorite={() => handleToggleFavorite(w.id)} 
                onMarkLearned={() => handleMarkLearned(w.id, !w.learned)} 
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
              <Button mode="contained" onPress={() => navigation.navigate(ROUTES.PRACTICE, { packId })}>
                Start Learning
              </Button>
            </Card.Actions>
          </Card>

          <Card style={styles.card} mode="elevated">
            <Card.Title title="Time Attack" subtitle="Sign as many words as possible" />
            <Card.Actions>
              <Button mode="outlined" onPress={() => navigation.navigate(ROUTES.TEST_CONFIG, { packId })}>
                Setup Test
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
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
