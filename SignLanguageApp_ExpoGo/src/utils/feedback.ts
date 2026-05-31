import * as Haptics from 'expo-haptics';
// import { Audio } from 'expo-audio';
import { useSettingsStore } from '../features/settings/store/useSettingsStore';

// We could load actual sound files here.
// const successSound = require('../../assets/sounds/success.mp3');
// const errorSound = require('../../assets/sounds/error.mp3');

export const triggerSuccessFeedback = async () => {
  const { haptics, sound } = useSettingsStore.getState();

  if (haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (sound.systemSounds) {
    // try {
    //   const { sound } = await Audio.Sound.createAsync(successSound);
    //   await sound.playAsync();
    // } catch (e) {
    //   console.log('Failed to play sound', e);
    // }
    console.log('[Audio Placeholder]: Playing Success Sound');
  }
};

export const triggerErrorFeedback = async () => {
  const { haptics, sound } = useSettingsStore.getState();

  if (haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  if (sound.systemSounds) {
    // try {
    //   const { sound } = await Audio.Sound.createAsync(errorSound);
    //   await sound.playAsync();
    // } catch (e) {
    //   console.log('Failed to play sound', e);
    // }
    console.log('[Audio Placeholder]: Playing Error Sound');
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
