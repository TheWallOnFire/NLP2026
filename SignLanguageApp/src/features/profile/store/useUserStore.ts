import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  age: string;
  bio: string;
  email: string;
  location: string;
  nativeLanguage: string;
}

interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const initialProfile: UserProfile = {
  name: 'Signer Pro',
  age: '24',
  bio: 'Passionate about learning and teaching sign language to bridge communication gaps.',
  email: 'signer.pro@example.com',
  location: 'San Francisco, CA',
  nativeLanguage: 'English',
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
