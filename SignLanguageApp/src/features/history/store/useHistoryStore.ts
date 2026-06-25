import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  sign: string;
  signs?: string[];
  packId?: string;
  sessionId?: string;
  mode?: 'live' | 'picture' | 'video' | 'test' | 'batch';
  time: string;
  date: string;
  timestamp?: number;
  type: 'detection' | 'learning' | 'test';
  imageUri?: string;
  videoUri?: string;
  testStats?: { score: number; total: number; duration: number };
  testResults?: { word: string; isCorrect: boolean; correctness?: number; confusedWith?: string }[];
  batchResults?: { fileName: string; sign: string; conf: number }[];
}

interface HistoryState {
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id'>) => void;
  saveCameraSession: (text: string, packId?: string, appendToSessionId?: string | null) => void;
  addImageVideoSession: (mode: 'picture' | 'video', uri: string, resultWords: string[], packId?: string) => void;
  addBatchSession: (results: { fileName: string; sign: string; conf: number }[], packId?: string) => void;
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
      saveCameraSession: (text, packId, appendToSessionId) => set((state) => {
        const { history } = state;
        const now = Date.now();
        const words = text.split('\n').filter(w => w.trim().length > 0);
        
        if (appendToSessionId) {
          const index = history.findIndex(h => h.id === appendToSessionId);
          if (index !== -1) {
            const newHistory = [...history];
            const item = newHistory[index];
            newHistory[index] = { ...item, signs: [...(item.signs || []), ...words], timestamp: now };
            return { history: newHistory };
          }
        }
        
        // Create new
        const newId = now.toString() + '-' + Math.floor(Math.random() * 1000000).toString();
        const newItem: HistoryItem = {
          id: newId,
          sign: 'Camera Detection Session',
          signs: words,
          packId,
          mode: 'live',
          type: 'detection',
          date: new Date().toLocaleDateString('vi-VN'),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: now,
        };
        return { 
          history: [newItem, ...history].slice(0, 50)
        };
      }),
      addImageVideoSession: (mode, uri, resultWords, packId) => set((state) => {
        const newItem: HistoryItem = {
          id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString(),
          sign: mode === 'picture' ? 'Image Detection' : 'Video Detection',
          signs: resultWords,
          packId,
          mode,
          type: 'detection',
          date: new Date().toLocaleDateString('vi-VN'),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          imageUri: mode === 'picture' ? uri : undefined,
          videoUri: mode === 'video' ? uri : undefined,
        };
        return { history: [newItem, ...state.history].slice(0, 50) };
      }),
      addBatchSession: (results, packId) => set((state) => {
        const newItem: HistoryItem = {
          id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString(),
          sign: `Batch Detection (${results.length} images)`,
          signs: results.map(r => r.sign),
          batchResults: results,
          packId,
          mode: 'batch',
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
