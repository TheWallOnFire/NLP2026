import { useState, useMemo } from 'react';
import { useLearningStore, Word } from '../store/useLearningStore';
import { useModelStore } from '../store/useModelStore';
import { triggerSelectionFeedback, triggerSuccessFeedback } from '../../../utils/feedback';

export function usePackDetailLogic(packId: string) {
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const toggleFavorite = useLearningStore(state => state.toggleFavorite);
  const markLearned = useLearningStore(state => state.markLearned);
  
  const packs = useModelStore(state => state.packs);
  const pack = packs.find(p => p.id === packId);

  const progress = words.length > 0 ? words.filter(w => w.learned).length / words.length : 0;

  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [imageError, setImageError] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'learned' | 'unlearned'>('all');

  const filteredWords = useMemo(() => {
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

  return {
    pack,
    words,
    progress,
    selectedWord,
    setSelectedWord,
    imageError,
    setImageError,
    filterMode,
    setFilterMode,
    filteredWords,
    handlePressWord,
    handleToggleFavorite,
    handleMarkLearned
  };
}
