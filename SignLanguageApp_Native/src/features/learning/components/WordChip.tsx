import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { Word } from '../store/useLearningStore';

interface Props {
  word: Word;
  onToggleFavorite: (id: string) => void;
  onMarkLearned: (id: string, learned: boolean) => void;
}

export default function WordChip({ word, onToggleFavorite, onMarkLearned }: Props) {
  return (
    <Chip 
      icon={word.favorite ? 'star' : word.learned ? 'check-circle' : 'circle-outline'} 
      mode={word.learned ? 'flat' : 'outlined'}
      style={styles.chip}
      onPress={() => onToggleFavorite(word.id)}
      onLongPress={() => onMarkLearned(word.id, !word.learned)}
    >
      {word.word}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    margin: 4,
  },
});
