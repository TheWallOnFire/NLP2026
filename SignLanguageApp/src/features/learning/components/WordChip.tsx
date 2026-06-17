import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { Word } from '../store/useLearningStore';

interface Props {
  word: Word;
  onPressWord: (word: Word) => void;
  onLongPressWord: (word: Word) => void;
}

export default function WordChip({ word, onPressWord, onLongPressWord }: Props) {
  return (
    <Chip 
      icon={word.favorite ? 'star' : word.learned ? 'check-circle' : 'circle-outline'} 
      mode={word.learned ? 'flat' : 'outlined'}
      style={styles.chip}
      onPress={() => onPressWord(word)}
      onLongPress={() => onLongPressWord(word)}
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
