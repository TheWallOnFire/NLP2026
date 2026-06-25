import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface ModelPack {
  id: string;
  name: string;
  description: string;
  version: string;
  wordCount: number;
  isDownloaded: boolean;
  category: 'Basics' | 'Conversational' | 'Professional';
  inputShape?: number[];
}

interface ModelState {
  packs: ModelPack[];
  downloadPack: (id: string) => void;
  deletePack: (id: string) => Promise<void>;
  activePackId: string | null;
  setActivePack: (id: string | null) => void;
  customModelUri: string | null;
  setCustomModelUri: (uri: string | null) => void;
  importCustomPack: (pack: ModelPack) => void;
  resetPacks: () => void;
}



export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      packs: [],
      activePackId: null,
      downloadPack: (id) => set((state) => ({
        packs: state.packs.map(p => p.id === id ? { ...p, isDownloaded: true } : p)
      })),
      deletePack: async (id) => {
        try {
            const packDir = FileSystem.documentDirectory + `packs/${id}/`;
            const info = await FileSystem.getInfoAsync(packDir);
            if (info.exists) {
                await FileSystem.deleteAsync(packDir, { idempotent: true });
            }
        } catch (e) {
            console.error("Failed to delete pack folder", e);
        }
        set((state) => ({ packs: state.packs.filter(p => p.id !== id) }));
      },
      setActivePack: (id) => set({ activePackId: id }),
      customModelUri: null,
      setCustomModelUri: (uri) => set({ customModelUri: uri }),
      importCustomPack: (pack) => set((state) => ({
        packs: [...state.packs.filter(p => p.id !== pack.id), { ...pack, isDownloaded: true }]
      })),
      resetPacks: () => set({ packs: [], activePackId: null }),
    }),
    {
      name: 'model-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
