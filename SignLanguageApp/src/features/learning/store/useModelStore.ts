import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ModelPack {
  id: string;
  name: string;
  description: string;
  version: string;
  wordCount: number;
  isDownloaded: boolean;
  category: 'Basics' | 'Conversational' | 'Professional';
}

interface ModelState {
  packs: ModelPack[];
  downloadPack: (id: string) => void;
  deletePack: (id: string) => void;
  activePackId: string | null;
  setActivePack: (id: string | null) => void;
}

const generatePacks = (): ModelPack[] => {
  const categories: ModelPack['category'][] = ['Basics', 'Conversational', 'Professional'];
  return Array.from({ length: 12 }, (_, i) => ({
    id: `demo-${i + 1}`,
    name: `Demo ${i + 1}`,
    description: `Educational pack ${i + 1} for learning sign language signs and patterns.`,
    version: '1.0.0',
    wordCount: 10 + i * 2,
    isDownloaded: false,
    category: categories[i % 3]
  }));
};

const initialPacks: ModelPack[] = generatePacks();

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      packs: __DEV__ ? initialPacks : [], // Kept empty for prod as per previous request
      activePackId: null,
      downloadPack: (id) => set((state) => ({
        packs: state.packs.map(p => p.id === id ? { ...p, isDownloaded: true } : p)
      })),
      deletePack: (id) => set((state) => ({
        packs: state.packs.map(p => p.id === id ? { ...p, isDownloaded: false } : p)
      })),
      setActivePack: (id) => set({ activePackId: id }),
    }),
    {
      name: 'model-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
