import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system/legacy';

interface PracticeHeaderProps {
  currentWord: any;
  currentIndex: number;
  totalWords: number;
  packId: string;
}

export default function PracticeHeader({
  currentWord,
  currentIndex,
  totalWords,
  packId
}: PracticeHeaderProps) {
  const { t } = useTranslation();

  if (!currentWord) return null;

  return (
    <>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.wordTitle}>{currentWord.word}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {t('learning.wordCountOf', { current: currentIndex + 1, total: totalWords })}
          </Text>
        </View>
      </View>

      <Card style={styles.card} mode="elevated">
        <Image 
          key={currentWord.id}
          source={{ uri: `${FileSystem.documentDirectory}packs/${packId}/word_images/${currentWord.word}.png` }} 
          style={{ width: '100%', height: 220 }}
          resizeMode="contain"
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
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
});
