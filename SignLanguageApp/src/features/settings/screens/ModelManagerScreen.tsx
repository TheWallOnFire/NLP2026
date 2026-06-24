import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, SegmentedButtons, IconButton, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useModelManagerLogic } from '../hooks/useModelManagerLogic';
import ModelPackItem from '../components/ModelPackItem';

export default function ModelManagerScreen({ navigation }: any) {
  const theme = useTheme();
  
  const {
    viewMode, setViewMode,
    mainTab, setMainTab,
    searchQuery, onChangeSearch,
    currentPage, setCurrentPage,
    validationMap, isScanning,
    handleScanLibrary, handleDownloadPack, handleOpenPack, handleDeletePack,
    currentPacks, pagedPacks, totalPages, packWords
  } = useModelManagerLogic(navigation);

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
              {pagedPacks.map(pack => (
                <ModelPackItem 
                  key={pack.id}
                  item={pack}
                  mode={viewMode}
                  theme={theme}
                  packWords={packWords}
                  validationMap={validationMap}
                  mainTab={mainTab}
                  onOpen={handleOpenPack}
                  onDownload={handleDownloadPack}
                  onDelete={handleDeletePack}
                />
              ))}
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
