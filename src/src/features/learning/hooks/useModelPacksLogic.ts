import { useState, useMemo } from 'react';
import { useModelStore, ModelPack } from '../store/useModelStore';
import { useLearningStore } from '../store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';

const ITEMS_PER_PAGE = 6;

export function useModelPacksLogic(navigation: any) {
  const packs = useModelStore(state => state.packs);
  const setActivePack = useModelStore(state => state.setActivePack);

  const packWords = useLearningStore(state => state.packWords);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);

  const handleOpenPack = (pack: ModelPack) => {
    triggerSelectionFeedback();
    setActivePack(pack.id);
    navigation.navigate(ROUTES.PACK_DETAIL, { packId: pack.id });
  };

  const downloadedPacks = useMemo(() => packs.filter(p => p.isDownloaded), [packs]);
  const currentPacks = downloadedPacks;

  const totalPages = Math.ceil(currentPacks.length / ITEMS_PER_PAGE);
  const pagedPacks = useMemo(() => {
    return currentPacks.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [currentPacks, currentPage]);

  return {
    viewMode, setViewMode,
    currentPage, setCurrentPage,
    handleOpenPack,
    currentPacks, pagedPacks, totalPages, packWords
  };
}
