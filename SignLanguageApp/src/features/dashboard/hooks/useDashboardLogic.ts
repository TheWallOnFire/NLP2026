import { useMemo, useState, useCallback } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useUserStore } from '../../profile/store/useUserStore';
import i18n from '../../../core/i18n';

export function useDashboardLogic() {
  const packs = useModelStore(state => state.packs);
  const packWords = useLearningStore(useShallow(state => state.packWords));
  const history = useHistoryStore(state => state.history);
  const { profile } = useUserStore();
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);

  const downloadedPacks = useMemo(() => packs.filter(p => p.isDownloaded), [packs]);
  
  const stats = useMemo(() => {
    let total = 0;
    let learned = 0;
    for (const packKey in packWords) {
      const words = packWords[packKey] || [];
      total += words.length;
      for (const w of words) {
        if (w.learned) learned++;
      }
    }
    const progress = total > 0 ? Number((learned / total).toFixed(4)) : 0;
    return { total, learned, progress };
  }, [packWords]);

  const recentHistory = useMemo(() => Array.isArray(history) ? history.slice(0, 3) : [], [history]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!isFocused) return false;
        Alert.alert(
          i18n.t('dashboard.exitApp'),
          i18n.t('dashboard.exitConfirm'),
          [
            { text: i18n.t('dashboard.cancel'), style: 'cancel' },
            { text: i18n.t('dashboard.exit'), style: 'destructive', onPress: () => BackHandler.exitApp() }
          ],
          { cancelable: true }
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isFocused])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return {
    profile,
    refreshing,
    onRefresh,
    downloadedPacks,
    stats,
    recentHistory,
    packWords
  };
}
