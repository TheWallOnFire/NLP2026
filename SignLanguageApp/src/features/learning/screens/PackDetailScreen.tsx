import * as React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, ProgressBar, useTheme, Appbar, Modal, Portal, IconButton, SegmentedButtons } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useLearningStore, Word } from '../store/useLearningStore';
import WordChip from '../components/WordChip';
import { ROUTES } from '../../../constants/routes';
import { usePackDetailLogic } from '../hooks/usePackDetailLogic';
import { useTranslation } from 'react-i18next';

export default function PackDetailScreen({ route, navigation }: any) {
  const { packId } = route.params || {};
  const theme = useTheme();
  const { t } = useTranslation();
  
  const {
    pack, progress, selectedWord, setSelectedWord, imageError, setImageError,
    filterMode, setFilterMode, filteredWords, handlePressWord, handleToggleFavorite, handleMarkLearned
  } = usePackDetailLogic(packId);

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
          <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t('learning.progress')}: {Math.round((progress || 0) * 100)}%</Text>
          <ProgressBar progress={progress || 0} style={styles.progressBar} color="white" />
        </LinearGradient>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>{t('learning.vocabulary')}</Text>
          
          <SegmentedButtons
            value={filterMode}
            onValueChange={(val) => setFilterMode(val as any)}
            buttons={[
              { value: 'all', label: t('learning.all') },
              { value: 'learned', label: t('learning.learned') },
              { value: 'unlearned', label: t('learning.unlearned') },
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
              <Text style={{ color: 'gray', fontStyle: 'italic', padding: 8 }}>{t('learning.noWordsInThisCategory')}</Text>
            )}
          </View>
          <Text variant="bodySmall" style={styles.hint}>{t('learning.tapToViewHint')}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>{t('learning.practiceAndTest')}</Text>
          <Card style={styles.card} mode="elevated">
            <Card.Title title={t('learning.interactiveLearning')} subtitle={t('learning.learnNewSigns')} />
            <Card.Actions>
              <Button mode="contained" onPress={() => navigation.navigate(ROUTES.PRACTICE, { packId })}>
                {t('learning.startLearning')}
              </Button>
            </Card.Actions>
          </Card>

          <Card style={styles.card} mode="elevated">
            <Card.Title title={t('learning.timeAttack')} subtitle={t('learning.signAsMany')} />
            <Card.Actions>
              <Button mode="outlined" onPress={() => navigation.navigate(ROUTES.TEST_CONFIG, { packId })}>
                {t('learning.setupTest')}
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
                    <Text variant="bodyLarge" style={{ color: 'gray' }}>{t('learning.noDemoImage')}</Text>
                  </View>
                )}
              </Card>

              <View style={styles.modalActions}>
                <View style={{ flexDirection: 'row' }}>
                  <IconButton 
                    icon={selectedWord.favorite ? "star" : "star-outline"} 
                    iconColor={selectedWord.favorite ? "#FFC107" : "gray"}
                    size={32}
                    onPress={() => handleToggleFavorite(selectedWord.id)}
                  />
                  <IconButton 
                    icon={selectedWord.learned ? "check-circle" : "check-circle-outline"} 
                    iconColor={selectedWord.learned ? "#4CAF50" : "gray"}
                    size={32}
                    onPress={() => handleMarkLearned(selectedWord.id, !selectedWord.learned)}
                  />
                </View>
                <Button 
                  mode="contained" 
                  icon="play-circle" 
                  style={{ flex: 1, marginLeft: 16 }}
                  onPress={() => {
                    setSelectedWord(null);
                    navigation.navigate(ROUTES.PRACTICE, { packId, wordId: selectedWord.id });
                  }}
                >
                  {t('learning.practiceNow')}
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
