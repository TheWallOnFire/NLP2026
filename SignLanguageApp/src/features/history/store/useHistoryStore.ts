import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  sign: string;
  signs?: string[];
  packId?: string;
  sessionId?: string;
  mode?: string;
  time: string;
  date: string;
  timestamp?: number;
  type: 'detection' | 'learning' | 'test';
}

interface HistoryState {
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id'>) => void;
  addManualDetectionSession: (sentence: string, packId: string, mode?: string) => void;
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
        history: [{ ...item, id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString() }, ...state.history].slice(0, 50),
      })),
      addManualDetectionSession: (sentence, packId, mode) => set((state) => {
        const newItem: HistoryItem = {
          id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString(),
          sign: `Phiên nhận diện`,
          signs: sentence.split(' '), // Split sentence into words for compatibility
          packId,
          mode,
          type: 'detection',
          date: new Date().toLocaleDateString('vi-VN'),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
        };
        return { history: [newItem, ...state.history].slice(0, 50) };
      }),
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
