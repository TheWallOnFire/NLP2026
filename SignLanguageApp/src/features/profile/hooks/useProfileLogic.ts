import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useUserStore } from '../store/useUserStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';

export function useProfileLogic() {
  const packWords = useLearningStore(state => state.packWords);
  const { profile, updateProfile } = useUserStore();
  const { history, clearHistory } = useHistoryStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const learnedCount = Object.values(packWords).flat().filter(w => w.learned).length;
  const favoriteCount = Object.values(packWords).flat().filter(w => w.favorite).length;

  const handleSave = () => {
    updateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
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
    history,
    handleSave,
    handleCancel,
    confirmClearHistory
  };
}
