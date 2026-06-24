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
  memberSince: string;
  level: string;
  preferredHand: string;
  learningGoal: string;
  gender: string;
  occupation: string;
  motivation: string;
  avatar: string;
  birth: string;
  learningTime: number;
  lastAccessedPackId: string | null;
}

interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const initialProfile: UserProfile = {
  name: 'Signer Pro',
  age: '24',
  bio: 'Passionate about learning and teaching sign language to bridge communication gaps.',
  email: 'signer.pro@example.com',
  location: 'San Francisco, CA',
  nativeLanguage: 'English',
  memberSince: 'May 2026',
  level: 'Intermediate',
  preferredHand: 'Right',
  learningGoal: 'Conversational Fluency',
  gender: 'Non-binary',
  occupation: 'Accessibility Advocate',
  motivation: 'Communication with family members',
  avatar: '',
  birth: '2002-01-01',
  learningTime: 0,
  lastAccessedPackId: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),
      resetProfile: () => set({ profile: initialProfile }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
