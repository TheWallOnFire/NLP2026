import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useModelPacksLogic } from '../hooks/useModelPacksLogic';
import LearningPackItem from '../components/LearningPackItem';

export default function ModelPacksScreen({ navigation }: any) {
  const theme = useTheme();
  const {
    viewMode, setViewMode,
    currentPage, setCurrentPage,
    handleOpenPack,
    currentPacks, pagedPacks, totalPages, packWords
  } = useModelPacksLogic(navigation);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerToolbar}
      >
        <Text variant="headlineSmall" style={styles.headerTitle}>Learning Modules</Text>
        <View style={styles.tabActions}>
          <IconButton
            icon={viewMode === 'list' ? 'view-grid' : 'view-list'}
            iconColor="white"
            size={24}
            onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
          />
        </View>
      </LinearGradient>

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
              {pagedPacks.map(pack => (
                <LearningPackItem 
                  key={pack.id}
                  item={pack}
                  mode={viewMode}
                  theme={theme}
                  packWords={packWords}
                  onOpen={handleOpenPack}
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
    padding: 16,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  tabActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
