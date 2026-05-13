import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, useTheme, ProgressBar, Badge, SegmentedButtons, IconButton } from 'react-native-paper';
import { useModelStore, ModelPack } from '../store/useModelStore';
import { useLearningStore } from '../store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const COLUMN_WIDTH = (width - (GRID_PADDING * 3)) / 2;
const ITEMS_PER_PAGE = 4;

export default function ModelPacksScreen({ navigation }: any) {
  const theme = useTheme();
  const packs = useModelStore(state => state.packs);
  const downloadPack = useModelStore(state => state.downloadPack);
  const setActivePack = useModelStore(state => state.setActivePack);
  
  const packWords = useLearningStore(state => state.packWords);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleOpenPack = (pack: ModelPack) => {
    triggerSelectionFeedback();
    setActivePack(pack.id);
    navigation.navigate(ROUTES.PACK_DETAIL, { packId: pack.id });
  };

  const downloadedPacks = packs.filter(p => p.isDownloaded);
  const availablePacks = packs.filter(p => !p.isDownloaded);
  
  // Pagination logic
  const totalPages = Math.ceil(availablePacks.length / ITEMS_PER_PAGE);
  const pagedAvailablePacks = availablePacks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderPackItem = (item: ModelPack, mode: 'list' | 'grid') => {
    const words = packWords[item.id] || [];
    const progress = words.length > 0 ? words.filter(w => w.learned).length / words.length : 0;
    
    if (mode === 'grid') {
      return (
        <Card 
          key={item.id}
          style={[styles.gridCard, { width: COLUMN_WIDTH }]} 
          mode="elevated" 
          onPress={item.isDownloaded ? () => handleOpenPack(item) : undefined}
        >
          <View style={styles.gridCardInner}>
            <Badge size={20} style={[styles.gridBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
              {item.category[0]}
            </Badge>
            <Text variant="titleSmall" numberOfLines={1} style={styles.gridTitle}>{item.name}</Text>
            <Text variant="bodySmall" style={styles.gridSubtitle}>{item.wordCount} signs</Text>
            
            {item.isDownloaded ? (
              <View style={styles.gridProgressContainer}>
                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.gridProgressBar} />
                <Text variant="labelSmall">{Math.round(progress * 100)}%</Text>
              </View>
            ) : (
              <Button 
                mode="contained-tonal" 
                compact 
                onPress={() => downloadPack(item.id)}
                style={styles.gridDownloadBtn}
                labelStyle={{ fontSize: 10 }}
              >
                Get
              </Button>
            )}
          </View>
        </Card>
      );
    }

    return (
      <Card 
        key={item.id}
        style={styles.listCard} 
        mode="outlined" 
        onPress={item.isDownloaded ? () => handleOpenPack(item) : undefined}
      >
        <View style={styles.listCardInner}>
          <View style={styles.listMainInfo}>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: 'gray' }}>{item.description}</Text>
          </View>
          
          <View style={styles.listSideInfo}>
            {item.isDownloaded ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>{Math.round(progress * 100)}%</Text>
                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.listProgressBar} />
              </View>
            ) : (
              <Button mode="contained-tonal" compact onPress={() => downloadPack(item.id)}>
                Get
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
        <SegmentedButtons
          value={viewMode}
          onValueChange={(v: any) => setViewMode(v)}
          style={styles.toggleButtons}
          buttons={[
            { value: 'list', icon: 'view-list', label: 'List' },
            { value: 'grid', icon: 'view-grid', label: 'Grid' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {downloadedPacks.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>My Learning</Text>
            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {downloadedPacks.map(pack => renderPackItem(pack, viewMode))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Explore More</Text>
            {totalPages > 1 && (
              <Text variant="labelSmall">Page {currentPage} of {totalPages}</Text>
            )}
          </View>
          
          <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {pagedAvailablePacks.map(pack => renderPackItem(pack, viewMode))}
          </View>

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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleButtons: {
    width: '60%',
  },
  scrollContent: {
    paddingBottom: 24,
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
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gridTitle: {
    marginTop: 8,
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
