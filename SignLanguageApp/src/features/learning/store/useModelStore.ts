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

const initialPacks: ModelPack[] = [
  { 
    id: 'asl-basics', 
    name: 'ASL Basics', 
    description: 'Essential signs like Hello, Thank You, and common pronouns.',
    version: '1.2.0',
    wordCount: 15,
    isDownloaded: true,
    category: 'Basics'
  },
  { 
    id: 'asl-numbers', 
    name: 'Numbers & Counting', 
    description: 'Master numbers 0-100 and basic mathematical signs.',
    version: '1.0.1',
    wordCount: 20,
    isDownloaded: false,
    category: 'Basics'
  },
  { 
    id: 'asl-medical', 
    name: 'Medical ASL', 
    description: 'Specialized signs for healthcare environments and emergency situations.',
    version: '2.1.0',
    wordCount: 45,
    isDownloaded: false,
    category: 'Professional'
  }
];

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      packs: initialPacks,
      activePackId: 'asl-basics',
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
