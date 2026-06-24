import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useUserStore } from '../store/useUserStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import i18n from '../../../core/i18n';

export function useProfileLogic() {
  const packWords = useLearningStore(state => state.packWords);
  const { profile, updateProfile } = useUserStore();
  const { history, clearHistory } = useHistoryStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const learnedCount = Object.values(packWords).flat().filter(w => w.learned).length;
  const favoriteCount = Object.values(packWords).flat().filter(w => w.favorite).length;

  const calculateStreak = () => {
    if (!history || history.length === 0) return 0;
    
    // Extract unique dates sorted descending
    const uniqueDates = Array.from(new Set(
      history
        .map(h => {
          if (h.timestamp) return new Date(h.timestamp).setHours(0, 0, 0, 0);
          return new Date().setHours(0,0,0,0); // Fallback
        })
    )).sort((a, b) => b - a);

    let streak = 0;
    let today = new Date().setHours(0, 0, 0, 0);
    const oneDay = 86400000;

    // If the latest activity is not today and not yesterday, streak is 0
    if (uniqueDates.length > 0 && uniqueDates[0] < today - oneDay) {
      return 0;
    }

    let expectedDate = uniqueDates[0] === today ? today : today - oneDay;

    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === expectedDate) {
        streak++;
        expectedDate -= oneDay;
      } else if (uniqueDates[i] === today && expectedDate === today - oneDay) {
        // Handled: user has both today and yesterday, loop continues
        continue; 
      } else {
        break;
      }
    }
    return streak;
  };

  const streakDays = calculateStreak();

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditedProfile(prev => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editedProfile.name || editedProfile.name.trim().length < 3) {
      newErrors.name = i18n.t('profile.nameTooShort') || 'Name must be at least 3 characters.';
    }
    if (editedProfile.name && editedProfile.name.length > 50) {
      newErrors.name = i18n.t('profile.nameTooLong') || 'Name must not exceed 50 characters.';
    }
    if (!editedProfile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = i18n.t('profile.invalidEmail') || 'Invalid email format.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      updateProfile(editedProfile);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setErrors({});
    setIsEditing(false);
  };

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Delete all activity history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearHistory }
      ]
    );
  };

  return {
    profile,
    editedProfile,
    setEditedProfile,
    isEditing,
    setIsEditing,
    learnedCount,
    favoriteCount,
    streakDays,
    handleSave,
    handleCancel,
    handlePickImage,
    errors
  };
}
