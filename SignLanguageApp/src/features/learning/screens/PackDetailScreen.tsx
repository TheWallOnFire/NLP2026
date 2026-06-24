import * as React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, ProgressBar, useTheme, Appbar, Modal, Portal, IconButton, SegmentedButtons } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useLearningStore, Word } from '../store/useLearningStore';
import { useModelStore } from '../store/useModelStore';
import { triggerSelectionFeedback, triggerSuccessFeedback } from '../../../utils/feedback';
import WordChip from '../components/WordChip';
import { ROUTES } from '../../../constants/routes';

export default function PackDetailScreen({ route, navigation }: any) {
  const { packId } = route.params || {};
  const theme = useTheme();
  
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const toggleFavorite = useLearningStore(state => state.toggleFavorite);
  const markLearned = useLearningStore(state => state.markLearned);
  
  const packs = useModelStore(state => state.packs);
  const pack = packs.find(p => p.id === packId);

  const progress = words.length > 0 ? words.filter(w => w.learned).length / words.length : 0;

  const [selectedWord, setSelectedWord] = React.useState<Word | null>(null);
  const [imageError, setImageError] = React.useState(false);
  const [filterMode, setFilterMode] = React.useState<'all' | 'learned' | 'unlearned'>('all');

  const filteredWords = React.useMemo(() => {
    if (filterMode === 'learned') return words.filter(w => w.learned);
    if (filterMode === 'unlearned') return words.filter(w => !w.learned);
    return words;
  }, [words, filterMode]);

  const handlePressWord = (word: Word) => {
    setImageError(false);
    setSelectedWord(word);
    triggerSelectionFeedback();
  };

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
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.tertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text variant="headlineMedium" style={{ color: 'white', fontWeight: 'bold' }}>{pack.name}</Text>
          <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Progress: {Math.round((progress || 0) * 100)}%</Text>
          <ProgressBar progress={progress || 0} style={styles.progressBar} color="white" />
        </LinearGradient>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Vocabulary</Text>
          
          <SegmentedButtons
            value={filterMode}
            onValueChange={(val) => setFilterMode(val as any)}
            buttons={[
              { value: 'all', label: 'Tất cả' },
              { value: 'learned', label: 'Đã học' },
              { value: 'unlearned', label: 'Chưa học' },
            ]}
            style={{ marginBottom: 16 }}
          />

          <View style={styles.chipContainer}>
            {filteredWords.map((w) => (
              <WordChip 
                key={w.id} 
                word={w} 
                onPressWord={handlePressWord} 
                onLongPressWord={(w) => handleMarkLearned(w.id, !w.learned)} 
              />
            ))}
            {filteredWords.length === 0 && (
              <Text style={{ color: 'gray', fontStyle: 'italic', padding: 8 }}>Không có từ nào trong mục này.</Text>
            )}
          </View>
          <Text variant="bodySmall" style={styles.hint}>Chạm để xem chi tiết, nhấn giữ để đánh dấu đã học.</Text>
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

      <Portal>
        <Modal
          visible={!!selectedWord}
          onDismiss={() => setSelectedWord(null)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        >
          {selectedWord && (
            <View>
              <View style={styles.modalHeader}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>{selectedWord.word}</Text>
                <IconButton icon="close" onPress={() => setSelectedWord(null)} />
              </View>
              
              <Card style={styles.imageCard}>
                {!imageError ? (
                  <Image 
                    source={{ uri: `${FileSystem.documentDirectory}packs/${packId}/word_images/${selectedWord.word}.png` }} 
                    style={styles.wordImage}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text variant="bodyLarge" style={{ color: 'gray' }}>No demo image available</Text>
                  </View>
                )}
              </Card>

              <View style={styles.modalActions}>
                <IconButton 
                  icon={selectedWord.favorite ? "star" : "star-outline"} 
                  iconColor={selectedWord.favorite ? "#FFC107" : "gray"}
                  size={32}
                  onPress={() => handleToggleFavorite(selectedWord.id)}
                />
                <Button 
                  mode="contained" 
                  icon="play-circle" 
                  style={{ flex: 1, marginLeft: 16 }}
                  onPress={() => {
                    setSelectedWord(null);
                    navigation.navigate(ROUTES.PRACTICE, { packId, wordId: selectedWord.id });
                  }}
                >
                  Practice Now
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 16,
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
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageCard: {
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  wordImage: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
