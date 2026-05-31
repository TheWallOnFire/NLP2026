import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
  theme: 'light' | 'dark' | 'mixed';
  sound: {
    systemSounds: boolean;
    learningFeedback: boolean;
    captureNotification: boolean;
    volume: number;
    ttsLanguage: string;
    voiceRate: number;
  };
  haptics: boolean;
  permissions: {
    camera: boolean;
    microphone: boolean;
  };
  storage: {
    localLogging: boolean;
    exportFormat: string;
  };
  systemAlerts: {
    dailyReminders: boolean;
    milestoneAlerts: boolean;
    powerManagement: boolean;
  };
  developerDebugMode: boolean;

  updateSettings: (updates: Partial<Omit<SettingsState, 'updateSettings'>>) => void;
}

const initialSettings: Omit<SettingsState, 'updateSettings'> = {
  theme: 'mixed',
  sound: {
    systemSounds: true,
    learningFeedback: true,
    captureNotification: true,
    volume: 1.0,
    ttsLanguage: 'en-US',
    voiceRate: 1.0,
  },
  haptics: true,
  permissions: {
    camera: true,
    microphone: false,
  },
  storage: {
    localLogging: true,
    exportFormat: 'csv',
  },
  systemAlerts: {
    dailyReminders: true,
    milestoneAlerts: true,
    powerManagement: false,
  },
  developerDebugMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
