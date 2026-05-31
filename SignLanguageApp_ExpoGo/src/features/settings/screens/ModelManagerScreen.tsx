import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ProgressBar, Badge, SegmentedButtons, IconButton, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useModelStore, ModelPack } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const COLUMN_WIDTH = (width - (GRID_PADDING * 3)) / 2;
const ITEMS_PER_PAGE = 6;

export default function ModelManagerScreen({ navigation }: any) {
  const theme = useTheme();
  const packs = useModelStore(state => state.packs);
  const downloadPack = useModelStore(state => state.downloadPack);
  const deletePack = useModelStore(state => state.deletePack);
  const setActivePack = useModelStore(state => state.setActivePack);

  const packWords = useLearningStore(state => state.packWords);
  const clearPackProgress = useLearningStore(state => state.clearPackProgress);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [mainTab, setMainTab] = React.useState<'my-packs' | 'explore'>('my-packs');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [validationMap, setValidationMap] = React.useState<Record<string, boolean>>({});
  const [isScanning, setIsScanning] = React.useState(false);

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleScanLibrary = () => {
    setIsScanning(true);
    triggerSelectionFeedback();

    // Simulate a brief scan period for better UX
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
        Alert.alert("Scan Complete", `Found ${invalidCount} packs with content issues. These have been disabled.`);
      }
    }, 800);
  };

  const handleDownloadPack = (pack: ModelPack) => {
    // Basic validation: Check if word data exists for this pack in the learning store
    const words = packWords[pack.id];

    if (!words || !Array.isArray(words) || words.length === 0) {
      Alert.alert(
        "Content Error",
        `Sorry, the content for "${pack.name}" is currently unavailable or corrupted. Please try again later.`,
        [{ text: "OK" }]
      );
      return;
    }

    // Advanced validation: Ensure words have required properties
    const isValid = words.every(w => w && typeof w.id === 'string' && typeof w.word === 'string');
    if (!isValid) {
      Alert.alert(
        "Format Error",
        `The pack "${pack.name}" contains invalid data format and cannot be loaded.`,
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
    navigation.navigate(ROUTES.PACK_DETAIL, { packId: pack.id });
  };

  const handleDeletePack = (pack: ModelPack) => {
    Alert.alert(
      "Remove Pack",
      `Are you sure you want to remove "${pack.name}"? This will delete your progress for this pack and move it back to the Explore tab.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
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

  const downloadedPacks = React.useMemo(() => packs.filter(p => p.isDownloaded), [packs]);
  const availablePacks = React.useMemo(() => packs.filter(p => !p.isDownloaded), [packs]);

  const currentPacks = React.useMemo(() => {
    let filtered = mainTab === 'my-packs' ? downloadedPacks : availablePacks;
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [mainTab, downloadedPacks, availablePacks, searchQuery]);

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

    const isValidated = validationMap[item.id] !== undefined;
    const isValid = validationMap[item.id] === true;
    const isDisabled = mainTab === 'explore' && isValidated && !isValid;

    if (mode === 'grid') {
      return (
        <Card
          key={item.id}
          style={[styles.gridCard, { width: COLUMN_WIDTH, opacity: isDisabled ? 0.4 : 1 }]}
          mode="elevated"
          onPress={(!isDisabled && item.isDownloaded) ? () => handleOpenPack(item) : undefined}
        >
          <View style={styles.gridCardInner}>
            <View style={styles.gridHeaderRow}>
              <Badge size={20} style={[styles.gridBadge, { backgroundColor: isDisabled ? theme.colors.error : theme.colors.secondaryContainer }]}>
                {isDisabled ? '!' : categoryInitial}
              </Badge>
              {item.isDownloaded && (
                <IconButton
                  icon="delete-outline"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => handleDeletePack(item)}
                  style={styles.gridDeleteBtn}
                  disabled={isDisabled}
                />
              )}
            </View>
            <Text variant="titleSmall" numberOfLines={1} style={[styles.gridTitle, { textDecorationLine: isDisabled ? 'line-through' : 'none' }]}>{name}</Text>
            <Text variant="bodySmall" style={styles.gridSubtitle}>{isDisabled ? 'Invalid Content' : `${wordCount} signs`}</Text>

            {item.isDownloaded ? (
              <View style={styles.gridProgressContainer}>
                <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.gridProgressBar} />
                <Text variant="labelSmall">{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
              </View>
            ) : (
              <Button
                mode="contained-tonal"
                compact
                onPress={() => handleDownloadPack(item)}
                style={styles.gridDownloadBtn}
                labelStyle={{ fontSize: 10 }}
                disabled={isDisabled}
              >
                {isDisabled ? 'Locked' : 'Get'}
              </Button>
            )}
          </View>
        </Card>
      );
    }

    return (
      <Card
        key={item.id}
        style={[styles.listCard, { opacity: isDisabled ? 0.4 : 1 }]}
        mode="outlined"
        onPress={(!isDisabled && item.isDownloaded) ? () => handleOpenPack(item) : undefined}
      >
        <View style={styles.listCardInner}>
          <View style={styles.listMainInfo}>
            <Text variant="titleMedium" style={{ textDecorationLine: isDisabled ? 'line-through' : 'none' }}>{name}</Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: isDisabled ? theme.colors.error : 'gray' }}>
              {isDisabled ? 'Error: Data structure is invalid or missing' : description}
            </Text>
          </View>

          <View style={styles.listSideInfo}>
            {item.isDownloaded ? (
              <View style={styles.listActionRow}>
                <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                  <Text variant="labelMedium" style={{ color: theme.colors.primary }}>{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
                  <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.listProgressBar} />
                </View>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => handleDeletePack(item)}
                  disabled={isDisabled}
                />
              </View>
            ) : (
              <Button mode="contained-tonal" compact onPress={() => handleDownloadPack(item)} disabled={isDisabled}>
                {isDisabled ? 'Locked' : 'Get'}
              </Button>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerToolbar}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
            <Text variant="titleMedium" style={{flex: 1, fontWeight: 'bold'}}>Model Manager</Text>
        </View>
        <Searchbar
          placeholder="Search packs..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />
        <View style={styles.tabActions}>
          <SegmentedButtons
            value={mainTab}
            onValueChange={(v: any) => { setMainTab(v); setCurrentPage(1); }}
            style={styles.mainTabs}
            buttons={[
              { value: 'my-packs', icon: 'bookmark', label: 'My Packs' },
              { value: 'explore', icon: 'compass', label: 'Explore' },
            ]}
          />
          {mainTab === 'explore' && (
            isScanning ? (
              <ActivityIndicator size={20} style={{ marginHorizontal: 12 }} />
            ) : (
              <IconButton
                icon="shield-search"
                size={24}
                iconColor={theme.colors.primary}
                onPress={handleScanLibrary}
                style={{ margin: 0 }}
              />
            )
          )}
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
              {mainTab === 'my-packs' ? 'Currently Learning' : 'Available Library'}
            </Text>
            {totalPages > 1 && (
              <Text variant="labelSmall">Page {currentPage} of {totalPages}</Text>
            )}
          </View>

          {currentPacks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={{ opacity: 0.5 }}>
                {mainTab === 'my-packs' ? 'No packs downloaded yet.' : 'No more packs to explore.'}
              </Text>
              {mainTab === 'my-packs' && (
                <Button mode="contained" onPress={() => setMainTab('explore')} style={{ marginTop: 16 }}>
                  Explore Library
                </Button>
              )}
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
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
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
