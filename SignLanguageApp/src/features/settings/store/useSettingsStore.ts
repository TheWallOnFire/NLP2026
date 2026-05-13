import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  hapticsEnabled: boolean;
  toggleHaptics: () => void;
  debugMode: boolean;
  toggleDebugMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      hapticsEnabled: true,
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      debugMode: false,
      toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
