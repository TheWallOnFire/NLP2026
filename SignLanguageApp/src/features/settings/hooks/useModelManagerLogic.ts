import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useModelStore, ModelPack } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';
import i18n from '../../../core/i18n';

const ITEMS_PER_PAGE = 6;

export function useModelManagerLogic(navigation: any) {
  const packs = useModelStore(state => state.packs);
  const downloadPack = useModelStore(state => state.downloadPack);
  const deletePack = useModelStore(state => state.deletePack);
  const setActivePack = useModelStore(state => state.setActivePack);

  const packWords = useLearningStore(state => state.packWords);
  const clearPackProgress = useLearningStore(state => state.clearPackProgress);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [mainTab, setMainTab] = useState<'my-packs' | 'explore'>('my-packs');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [validationMap, setValidationMap] = useState<Record<string, boolean>>({});
  const [isScanning, setIsScanning] = useState(false);

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleScanLibrary = () => {
    setIsScanning(true);
    triggerSelectionFeedback();

    setTimeout(() => {
      const newMap: Record<string, boolean> = {};
      packs.forEach(pack => {
        const words = packWords[pack.id];
        const isValid = words && Array.isArray(words) && words.length > 0 &&
          words.every(w => w && typeof w.id === 'string' && typeof w.word === 'string');
        newMap[pack.id] = !!isValid;
      });

      setValidationMap(newMap);
      setIsScanning(false);

      const invalidCount = Object.values(newMap).filter(v => !v).length;
      if (invalidCount > 0) {
        Alert.alert(i18n.t('settings.scanComplete'), i18n.t('settings.foundInvalidPacks', { count: invalidCount }));
      }
    }, 800);
  };

  const handleDownloadPack = (pack: ModelPack) => {
    const words = packWords[pack.id];

    if (!words || !Array.isArray(words) || words.length === 0) {
      Alert.alert(
        i18n.t('settings.error'),
        i18n.t('settings.contentError', { name: pack.name }),
        [{ text: "OK" }]
      );
      return;
    }

    const isValid = words.every(w => w && typeof w.id === 'string' && typeof w.word === 'string');
    if (!isValid) {
      Alert.alert(
        i18n.t('settings.error'),
        i18n.t('settings.formatError', { name: pack.name }),
        [{ text: "OK" }]
      );
      return;
    }

    triggerSelectionFeedback();
    downloadPack(pack.id);
  };

  const handleOpenPack = (pack: ModelPack) => {
    triggerSelectionFeedback();
    setActivePack(pack.id);
    navigation.navigate(ROUTES.LEARNING_TAB, { screen: ROUTES.PACK_DETAIL, params: { packId: pack.id } });
  };

  const handleDeletePack = (pack: ModelPack) => {
    Alert.alert(
      i18n.t('settings.removePack'),
      i18n.t('settings.removePackDesc', { name: pack.name }),
      [
        { text: i18n.t('common.cancel'), style: "cancel" },
        {
          text: i18n.t('common.delete'),
          style: "destructive",
          onPress: () => {
            deletePack(pack.id);
            clearPackProgress(pack.id);
            triggerSelectionFeedback();
          }
        }
      ]
    );
  };

  const downloadedPacks = useMemo(() => packs.filter(p => p.isDownloaded), [packs]);
  const availablePacks = useMemo(() => packs.filter(p => !p.isDownloaded), [packs]);

  const currentPacks = useMemo(() => {
    let filtered = mainTab === 'my-packs' ? downloadedPacks : availablePacks;
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [mainTab, downloadedPacks, availablePacks, searchQuery]);

  const totalPages = Math.ceil(currentPacks.length / ITEMS_PER_PAGE);
  const pagedPacks = useMemo(() => {
    return currentPacks.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [currentPacks, currentPage]);

  return {
    viewMode, setViewMode,
    mainTab, setMainTab,
    searchQuery, onChangeSearch,
    currentPage, setCurrentPage,
    validationMap, isScanning,
    handleScanLibrary, handleDownloadPack, handleOpenPack, handleDeletePack,
    currentPacks, pagedPacks, totalPages, packWords
  };
}
