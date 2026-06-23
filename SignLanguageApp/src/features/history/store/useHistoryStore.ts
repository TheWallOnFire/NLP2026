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

const safeStorage = {
  getItem: async (name: string) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.warn("Storage Get Error:", e);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.error("Storage Set Error (Possible 0 Bytes Free):", e);
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {}
  },
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      addHistoryItem: (item) => set((state) => ({
        // Use Math.random() for ID generation instead of crypto.randomUUID() which is not supported natively in Hermes
        history: [{ ...item, id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString() }, ...state.history].slice(0, 50),
      })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => safeStorage),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        history: persistedState?.history ? persistedState.history.slice(0, 50) : currentState.history,
      }),
    }
  )
);
