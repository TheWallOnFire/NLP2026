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
  // Map of packId to Word array
  packWords: Record<string, Word[]>;
  toggleFavorite: (packId: string, wordId: string) => void;
  markLearned: (packId: string, wordId: string, learned: boolean) => void;
  getPackProgress: (packId: string) => number;
  getPackWords: (packId: string) => Word[];
}

const defaultPacksWords: Record<string, Word[]> = {
  'asl-basics': [
    { id: '1', word: 'Hello', learned: true, favorite: false },
    { id: '2', word: 'Thank You', learned: true, favorite: true },
    { id: '3', word: 'Please', learned: false, favorite: false },
    { id: '4', word: 'Sorry', learned: false, favorite: false },
    { id: '5', word: 'Yes', learned: false, favorite: false },
    { id: '6', word: 'No', learned: false, favorite: true },
  ],
  'asl-numbers': [
    { id: 'n1', word: 'One', learned: false, favorite: false },
    { id: 'n2', word: 'Two', learned: false, favorite: false },
    { id: 'n3', word: 'Three', learned: false, favorite: false },
  ],
  'asl-medical': [
    { id: 'm1', word: 'Doctor', learned: false, favorite: false },
    { id: 'm2', word: 'Hospital', learned: false, favorite: false },
    { id: 'm3', word: 'Pain', learned: false, favorite: false },
  ]
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      packWords: defaultPacksWords,
      
      getPackWords: (packId) => get().packWords[packId] || [],
      
      getPackProgress: (packId) => {
        const words = get().packWords[packId] || [];
        if (words.length === 0) return 0;
        const learnedCount = words.filter(w => w.learned).length;
        return learnedCount / words.length;
      },

      toggleFavorite: (packId, wordId) => set((state) => {
        const words = state.packWords[packId] || [];
        const updatedWords = words.map(w => w.id === wordId ? { ...w, favorite: !w.favorite } : w);
        return { 
          packWords: { ...state.packWords, [packId]: updatedWords } 
        };
      }),

      markLearned: (packId, wordId, learned) => set((state) => {
        const words = state.packWords[packId] || [];
        const updatedWords = words.map(w => w.id === wordId ? { ...w, learned } : w);
        return { 
          packWords: { ...state.packWords, [packId]: updatedWords } 
        };
      }),
    }),
    {
      name: 'learning-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
