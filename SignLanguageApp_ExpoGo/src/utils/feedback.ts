import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSettingsStore } from '../features/settings/store/useSettingsStore';

// We could load actual sound files here.
// const successSound = require('../../assets/sounds/success.mp3');
// const errorSound = require('../../assets/sounds/error.mp3');

export const triggerSuccessFeedback = async () => {
  const { hapticsEnabled, soundEnabled } = useSettingsStore.getState();

  if (hapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (soundEnabled) {
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
  const { hapticsEnabled, soundEnabled } = useSettingsStore.getState();

  if (hapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  if (soundEnabled) {
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
  const { hapticsEnabled } = useSettingsStore.getState();
  
  if (hapticsEnabled) {
    Haptics.selectionAsync();
  }
};
export const triggerImpactFeedback = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    Haptics.impactAsync(style);
  }
};
