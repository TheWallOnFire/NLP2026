import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  sign: string;
  time: string;
  date: string;
  type: 'detection' | 'learning' | 'test';
}

interface HistoryState {
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id'>) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [
        // Default mock data so it's not empty immediately for demonstration
        { id: '1', sign: 'Hello', time: '10:30 AM', date: 'Today', type: 'detection' },
        { id: '2', sign: 'Thank You', time: '09:15 AM', date: 'Today', type: 'learning' },
        { id: '3', sign: 'A', time: '08:00 AM', date: 'Today', type: 'test' },
      ],
      addHistoryItem: (item) => set((state) => ({
        history: [{ ...item, id: Date.now().toString() }, ...state.history].slice(0, 100),
      })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
