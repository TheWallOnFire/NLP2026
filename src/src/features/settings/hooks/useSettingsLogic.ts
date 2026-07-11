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
import i18n from '../../../core/i18n';

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
      i18n.t('settings.clearCacheTitle'),
      i18n.t('settings.clearCacheMessage'),
      [
        { text: i18n.t('common.cancel'), style: "cancel" },
        {
          text: i18n.t('common.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              setIsClearing(true);
              const cacheDir = `${FileSystem.cacheDirectory}captured_media/`;
              const info = await FileSystem.getInfoAsync(cacheDir);
              if (info.exists) {
                await FileSystem.deleteAsync(cacheDir, { idempotent: true });
                await calculateCacheSize();
                triggerSuccessFeedback();
                Alert.alert(i18n.t('settings.success'), i18n.t('settings.cacheCleared'));
              }
            } catch (e) {
              Alert.alert(i18n.t('settings.error'), i18n.t('settings.cacheClearFailed'));
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
        Alert.alert(i18n.t('settings.success'), i18n.t('settings.importSuccess', { name: result.pack.name }));
      }
    } catch (error: any) {
      Alert.alert(i18n.t('settings.importFailed'), error.message || i18n.t('settings.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  const confirmClearHistory = () => {
    Alert.alert(
      i18n.t('settings.clearHistoryTitle'),
      i18n.t('settings.clearHistoryMessage'),
      [
        { text: i18n.t('common.cancel'), style: "cancel" },
        { text: i18n.t('common.delete'), style: "destructive", onPress: clearHistory }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      i18n.t('settings.resetAppTitle'),
      i18n.t('settings.resetAppMessage'),
      [
        { text: i18n.t('common.cancel'), style: "cancel" },
        {
          text: i18n.t('settings.resetEverything'),
          style: "destructive",
          onPress: async () => {
            try {
              resetPacks();
              await AsyncStorage.clear();
              settings.resetSettings();
              resetProfile();
              useHistoryStore.getState().clearHistory();
              useLearningStore.getState().resetAllProgress();
              triggerSuccessFeedback();
              Alert.alert(i18n.t('settings.success'), i18n.t('settings.factoryResetSuccess'));
            } catch (e) {
              Alert.alert(i18n.t('settings.error'), i18n.t('settings.factoryResetFailed'));
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
