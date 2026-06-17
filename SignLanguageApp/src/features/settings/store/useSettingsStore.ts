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
  camera: {
    defaultFacing: 'back' | 'front';
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
  detection: {
    speed: 'slow' | 'normal' | 'fast' | 'off';
  };
  systemAlerts: {
    dailyReminders: boolean;
    milestoneAlerts: boolean;
    powerManagement: boolean;
  };
  developerDebugMode: boolean;

  updateSettings: (updates: Partial<Omit<SettingsState, 'updateSettings' | 'resetSettings'>>) => void;
  resetSettings: () => void;
}

const initialSettings: Omit<SettingsState, 'updateSettings' | 'resetSettings'> = {
  theme: 'mixed',
  sound: {
    systemSounds: true,
    learningFeedback: true,
    captureNotification: true,
    volume: 1.0,
    ttsLanguage: 'en-US',
    voiceRate: 1.0,
  },
  camera: {
    defaultFacing: 'front',
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
  detection: {
    speed: 'normal',
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
      resetSettings: () => set(() => ({ ...initialSettings })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        sound: {
          ...currentState.sound,
          ...(persistedState?.sound || {}),
        },
        camera: {
          ...currentState.camera,
          ...(persistedState?.camera || {}),
        },
        permissions: {
          ...currentState.permissions,
          ...(persistedState?.permissions || {}),
        },
        storage: {
          ...currentState.storage,
          ...(persistedState?.storage || {}),
        },
        detection: {
          ...currentState.detection,
          ...(persistedState?.detection || {}),
        },
        systemAlerts: {
          ...currentState.systemAlerts,
          ...(persistedState?.systemAlerts || {}),
        },
      }),
    }
  )
);
