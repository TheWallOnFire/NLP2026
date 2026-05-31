import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ProgressBar, Badge, SegmentedButtons, IconButton, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useModelStore, ModelPack } from '../store/useModelStore';
import { useLearningStore } from '../store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const COLUMN_WIDTH = (width - (GRID_PADDING * 3)) / 2;
const ITEMS_PER_PAGE = 6;

export default function ModelPacksScreen({ navigation }: any) {
  const theme = useTheme();
  const packs = useModelStore(state => state.packs);
  const setActivePack = useModelStore(state => state.setActivePack);

  const packWords = useLearningStore(state => state.packWords);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleOpenPack = (pack: ModelPack) => {
    triggerSelectionFeedback();
    setActivePack(pack.id);
    navigation.navigate(ROUTES.PACK_DETAIL, { packId: pack.id });
  };

  const downloadedPacks = React.useMemo(() => packs.filter(p => p.isDownloaded), [packs]);
  const currentPacks = downloadedPacks;

  // Pagination logic
  const totalPages = Math.ceil(currentPacks.length / ITEMS_PER_PAGE);
  const pagedPacks = React.useMemo(() => {
    return currentPacks.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [currentPacks, currentPage]);

  const renderPackItem = (item: ModelPack, mode: 'list' | 'grid') => {
    let progress = 0;
    try {
      const words = packWords[item.id] || [];
      if (words.length > 0) {
        const learnedCount = words.filter(w => w?.learned).length;
        progress = learnedCount / words.length;
      }
    } catch (e) {
      console.warn(`Error calculating progress for pack ${item.id}:`, e);
    }

    const categoryInitial = item?.category ? item.category[0] : '?';
    const wordCount = item?.wordCount || 0;
    const name = item?.name || 'Unknown Pack';
    const description = item?.description || 'No description available.';

    if (mode === 'grid') {
      return (
        <Card
          key={item.id}
          style={[styles.gridCard, { width: COLUMN_WIDTH }]}
          mode="elevated"
          onPress={() => handleOpenPack(item)}
        >
          <View style={styles.gridCardInner}>
            <View style={styles.gridHeaderRow}>
              <Badge size={20} style={[styles.gridBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                {categoryInitial}
              </Badge>
            </View>
            <Text variant="titleSmall" numberOfLines={1} style={styles.gridTitle}>{name}</Text>
            <Text variant="bodySmall" style={styles.gridSubtitle}>{`${wordCount} signs`}</Text>

            <View style={styles.gridProgressContainer}>
              <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.gridProgressBar} />
              <Text variant="labelSmall">{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
            </View>
          </View>
        </Card>
      );
    }

    return (
      <Card
        key={item.id}
        style={styles.listCard}
        mode="outlined"
        onPress={() => handleOpenPack(item)}
      >
        <View style={styles.listCardInner}>
          <View style={styles.listMainInfo}>
            <Text variant="titleMedium">{name}</Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: 'gray' }}>
              {description}
            </Text>
          </View>

          <View style={styles.listSideInfo}>
            <View style={styles.listActionRow}>
              <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
                <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.listProgressBar} />
              </View>
              <IconButton icon="chevron-right" size={20} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerToolbar}>
        <Text variant="titleLarge" style={styles.headerTitle}>Learning Modules</Text>
        <View style={styles.tabActions}>
          <View style={styles.mainTabs} />
          <IconButton
            icon={viewMode === 'list' ? 'view-grid' : 'view-list'}
            size={24}
            onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Currently Learning
            </Text>
            {totalPages > 1 && (
              <Text variant="labelSmall">Page {currentPage} of {totalPages}</Text>
            )}
          </View>

          {currentPacks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={{ opacity: 0.5 }}>
                No packs downloaded yet. Go to Settings to manage your models!
              </Text>
            </View>
          ) : (
            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {pagedPacks.map(pack => renderPackItem(pack, viewMode))}
            </View>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <IconButton
                icon="chevron-left"
                disabled={currentPage === 1}
                onPress={() => setCurrentPage(prev => prev - 1)}
              />
              <View style={styles.dotContainer}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i + 1 === currentPage ? theme.colors.primary : theme.colors.outlineVariant }
                    ]}
                  />
                ))}
              </View>
              <IconButton
                icon="chevron-right"
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage(prev => prev + 1)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerToolbar: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchBar: {
    height: 45,
    elevation: 0,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  tabActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTabs: {
    flex: 1,
    marginRight: 8,
  },
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    opacity: 0.7,
  },
  listContainer: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    borderRadius: 12,
  },
  gridCardInner: {
    padding: 12,
    alignItems: 'center',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  gridBadge: {
    alignSelf: 'center',
  },
  gridDeleteBtn: {
    margin: -8,
  },
  gridTitle: {
    marginTop: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  gridSubtitle: {
    color: 'gray',
    marginBottom: 8,
  },
  gridProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  gridProgressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  gridDownloadBtn: {
    marginTop: 4,
  },
  listCard: {
    borderRadius: 12,
  },
  listCardInner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  listSideInfo: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  listActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listProgressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
