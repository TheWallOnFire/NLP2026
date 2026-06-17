import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useSettingsStore } from '../features/settings/store/useSettingsStore';

export const triggerSuccessFeedback = async (wordToSpeak?: string) => {
  const { haptics, sound } = useSettingsStore.getState();

  if (haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (sound.systemSounds) {
    if (wordToSpeak) {
      Speech.speak(wordToSpeak, { rate: 1.1, pitch: 1.2 });
    } else {
      Speech.speak("Success", { rate: 1.2, pitch: 1.5 });
    }
  }
};

export const triggerErrorFeedback = async () => {
  const { haptics, sound } = useSettingsStore.getState();

  if (haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  if (sound.systemSounds) {
    Speech.speak("Try again", { rate: 1.1, pitch: 0.9 });
  }
};

export const triggerSelectionFeedback = () => {
  const { haptics } = useSettingsStore.getState();

  if (haptics) {
    Haptics.selectionAsync();
  }
};
export const triggerImpactFeedback = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  const { haptics } = useSettingsStore.getState();
  if (haptics) {
    Haptics.impactAsync(style);
  }
};
