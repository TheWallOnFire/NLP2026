import * as React from 'react';
import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text, Button, SegmentedButtons, useTheme, Surface, IconButton } from 'react-native-paper';
import { useLearningStore } from '../store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { useTranslation } from 'react-i18next';

export default function PracticeWordSetupScreen({ route, navigation }: any) {
  const { packId } = route.params || {};
  const theme = useTheme();
  const { t } = useTranslation();
  
  const words = useLearningStore(state => state.packWords[packId]) || [];
  
  const [filterType, setFilterType] = useState<'all' | 'learned' | 'unlearned' | 'favorite' | 'unfavorited'>('all');
  
  const filteredWords = useMemo(() => {
    switch (filterType) {
      case 'learned': return words.filter(w => w.learned);
      case 'unlearned': return words.filter(w => !w.learned);
      case 'favorite': return words.filter(w => w.favorite);
      case 'unfavorited': return words.filter(w => !w.favorite);
      default: return words;
    }
  }, [words, filterType]);
  
  const maxWords = filteredWords.length;
  const [wordCount, setWordCount] = useState(maxWords > 0 ? maxWords : 0);

  // Đảm bảo wordCount luôn hợp lệ khi đổi filter
  React.useEffect(() => {
    setWordCount(maxWords > 0 ? maxWords : 0);
  }, [maxWords]);

  const adjustCount = (amount: number) => {
    setWordCount(prev => {
      const newVal = prev + amount;
      if (newVal < 1) return 1;
      if (newVal > maxWords) return maxWords;
      return newVal;
    });
  };

  const handleStart = () => {
    navigation.navigate(ROUTES.PRACTICE_WORD_FLASHCARD, {
      packId,
      filterType,
      wordCount
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('learning.setupFlashcards')} />
      </Appbar.Header>

      <View style={styles.content}>
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.label}>{t('learning.selectVocabType')}</Text>
          <SegmentedButtons
            value={filterType}
            onValueChange={(val) => setFilterType(val as any)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'learned', label: 'Learned' },
              { value: 'unlearned', label: 'Unlearned' },
            ]}
            style={styles.segmented}
          />
          <SegmentedButtons
            value={filterType}
            onValueChange={(val) => setFilterType(val as any)}
            buttons={[
              { value: 'favorite', label: 'Favorite' },
              { value: 'unfavorited', label: 'Unfavorited' },
            ]}
          />
          <Text variant="bodySmall" style={styles.infoText}>
            Có sẵn: {maxWords} từ
          </Text>
        </Surface>

        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.label}>{t('learning.numberOfCards')}</Text>
          <View style={styles.counterRow}>
            <View style={styles.btnCol}>
              <Button mode="outlined" onPress={() => adjustCount(-5)} disabled={wordCount <= 1 || maxWords === 0}>-5</Button>
            </View>
            <View style={styles.btnCol}>
              <IconButton icon="minus-circle" size={30} onPress={() => adjustCount(-1)} disabled={wordCount <= 1 || maxWords === 0} />
            </View>
            
            <View style={styles.countDisplay}>
              <Text variant="displayMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {maxWords === 0 ? 0 : wordCount}
              </Text>
            </View>

            <View style={styles.btnCol}>
              <IconButton icon="plus-circle" size={30} onPress={() => adjustCount(1)} disabled={wordCount >= maxWords || maxWords === 0} />
            </View>
            <View style={styles.btnCol}>
              <Button mode="outlined" onPress={() => adjustCount(5)} disabled={wordCount >= maxWords || maxWords === 0}>+5</Button>
            </View>
          </View>
        </Surface>

        <Button 
          mode="contained" 
          onPress={handleStart} 
          disabled={maxWords === 0}
          style={styles.startButton}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ fontSize: 18 }}
        >
          {maxWords === 0 ? t('learning.noVocabulary') : t('learning.startPracticeBtn')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flex: 1 },
  card: { padding: 16, borderRadius: 12, marginBottom: 20 },
  label: { fontWeight: 'bold', marginBottom: 12 },
  segmented: { marginBottom: 10 },
  infoText: { marginTop: 10, fontStyle: 'italic', color: 'gray', textAlign: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  btnCol: { alignItems: 'center' },
  countDisplay: { minWidth: 80, alignItems: 'center' },
  startButton: { marginTop: 'auto', marginBottom: 20 },
});
