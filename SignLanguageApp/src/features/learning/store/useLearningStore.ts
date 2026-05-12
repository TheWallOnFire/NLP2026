import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Word {
  id: string;
  word: string;
  learned: boolean;
  favorite: boolean;
}

interface LearningState {
  words: Word[];
  toggleFavorite: (id: string) => void;
  markLearned: (id: string, learned: boolean) => void;
  progress: number; // percentage 0-1
}

const defaultWords: Word[] = [
  { id: '1', word: 'Hello', learned: true, favorite: false },
  { id: '2', word: 'Thank You', learned: true, favorite: true },
  { id: '3', word: 'Please', learned: false, favorite: false },
  { id: '4', word: 'Sorry', learned: false, favorite: false },
  { id: '5', word: 'Yes', learned: false, favorite: false },
  { id: '6', word: 'No', learned: false, favorite: true },
];

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      words: defaultWords,
      progress: 2 / 6, // 2 out of 6 default words learned
      toggleFavorite: (id) => set((state) => {
        const updatedWords = state.words.map(w => w.id === id ? { ...w, favorite: !w.favorite } : w);
        return { words: updatedWords };
      }),
      markLearned: (id, learned) => set((state) => {
        const updatedWords = state.words.map(w => w.id === id ? { ...w, learned } : w);
        const learnedCount = updatedWords.filter(w => w.learned).length;
        const newProgress = learnedCount / updatedWords.length;
        return { words: updatedWords, progress: newProgress };
      }),
    }),
    {
      name: 'learning-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
