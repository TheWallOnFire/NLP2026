import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../store/useSettingsStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useUserStore } from '../../profile/store/useUserStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';
import { importCustomPack } from '../../../utils/packImporter';

export function useSettingsLogic() {
  const settings = useSettingsStore();
  const { clearHistory } = useHistoryStore();
  const resetPacks = useModelStore(state => state.resetPacks);
  const importCustomPackAction = useModelStore(state => state.importCustomPack);
  const resetProfile = useUserStore(state => state.resetProfile);
  const resetAllProgress = useLearningStore(state => state.resetAllProgress);
  const initializePackWords = useLearningStore(state => state.initializePackWords);

  const [isImporting, setIsImporting] = useState(false);
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const calculateCacheSize = useCallback(async () => {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}captured_media/`;
      const info = await FileSystem.getInfoAsync(cacheDir);
      if (!info.exists) {
        setCacheSize('0 KB');
        return;
      }
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalBytes = 0;
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
        if (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size) {
          totalBytes += fileInfo.size;
        }
      }
      if (totalBytes < 1024) setCacheSize(`${totalBytes} B`);
      else if (totalBytes < 1024 * 1024) setCacheSize(`${(totalBytes / 1024).toFixed(1)} KB`);
      else setCacheSize(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
    } catch {
      setCacheSize('N/A');
    }
  }, []);

  useEffect(() => {
    calculateCacheSize();
  }, [calculateCacheSize]);

  const handleClearCache = async () => {
    Alert.alert(
      "Xóa Cache",
      "Xóa toàn bộ ảnh/video đã lưu tạm? Thao tác này không ảnh hưởng đến lịch sử nhận diện.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setIsClearing(true);
              const cacheDir = `${FileSystem.cacheDirectory}captured_media/`;
              const info = await FileSystem.getInfoAsync(cacheDir);
              if (info.exists) {
                await FileSystem.deleteAsync(cacheDir, { idempotent: true });
              }
              await calculateCacheSize();
              triggerSuccessFeedback();
              Alert.alert("Thành công", "Đã xóa toàn bộ cache media.");
            } catch (e) {
              Alert.alert("Lỗi", "Không thể xóa cache.");
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const result = await importCustomPack();
      if (result) {
        initializePackWords(result.pack.id, result.words);
        importCustomPackAction(result.pack);
        Alert.alert("Success", `Imported ${result.pack.name} successfully!`);
      }
    } catch (error: any) {
      Alert.alert("Import Failed", error.message || "Failed to import model pack.");
    } finally {
      setIsImporting(false);
    }
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

  const handleClearAllData = () => {
    Alert.alert(
      "Reset App Data",
      "This will permanently delete all your learning progress, history, downloaded models, and personalized settings. You will be returned to the initial state.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              resetPacks();
              clearHistory();
              resetProfile();
              resetAllProgress();
              settings.resetSettings();
              await AsyncStorage.clear();
              triggerSuccessFeedback();
              Alert.alert("Success", "Your application has been reset to factory defaults.");
            } catch (e) {
              Alert.alert("Error", "Failed to clear system storage.");
            }
          }
        }
      ]
    );
  };

  return {
    settings,
    cacheSize,
    isClearing,
    isImporting,
    calculateCacheSize,
    handleClearCache,
    handleImport,
    confirmClearHistory,
    handleClearAllData
  };
}
