import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, useTheme, Button, Chip, Portal, Modal, IconButton } from 'react-native-paper';
import { Filter } from 'lucide-react-native';
import { useHistoryStore } from '../store/useHistoryStore';
import HistoryTimelineItem from '../components/HistoryTimelineItem';
import { useTranslation } from 'react-i18next';

export default function HistoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { history, clearHistory } = useHistoryStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('time_desc');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];

    // Lọc theo loại
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }

    // Sắp xếp
    result.sort((a, b) => {
      const timeA = a.timestamp || (a.date && a.time ? new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`).getTime() : 0);
      const timeB = b.timestamp || (b.date && b.time ? new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`).getTime() : 0);

      if (sortBy === 'time_desc') {
        return timeB - timeA;
      }
      if (sortBy === 'time_asc') {
        return timeA - timeB;
      }
      if (sortBy === 'count_desc') {
        return (b.signs?.length || 0) - (a.signs?.length || 0);
      }
      if (sortBy === 'name_asc') {
        const nameA = a.sign || a.packId || '';
        const nameB = b.sign || b.packId || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [history, filterType, sortBy]);

  const renderItem = ({ item }: { item: any }) => (
    <HistoryTimelineItem item={item} />
  );

  const confirmClearHistory = () => {
    Alert.alert(
      t('history.clearConfirmTitle'),
      t('history.clearConfirmDesc'),
      [
        { text: t('history.cancel'), style: "cancel" },
        { text: t('history.clearAction'), style: "destructive", onPress: clearHistory }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="titleMedium">{t('history.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon={() => <Filter size={20} color={theme.colors.primary} />} onPress={() => setIsFilterVisible(true)} />
          <Button mode="text" onPress={confirmClearHistory} disabled={history.length === 0} textColor="red">
            {t('history.clear')}
          </Button>
        </View>
      </View>

      <Portal>
        <Modal visible={isFilterVisible} onDismiss={() => setIsFilterVisible(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={{ marginBottom: 16, fontWeight: 'bold' }}>{t('history.filterTitle')}</Text>
          
          <Text variant="labelMedium" style={{ marginBottom: 8, opacity: 0.7 }}>{t('history.filterBy')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, maxHeight: 40 }}>
            <Chip selected={filterType === 'all'} onPress={() => setFilterType('all')} style={styles.chip}>{t('history.all')}</Chip>
            <Chip selected={filterType === 'detection'} onPress={() => setFilterType('detection')} style={styles.chip}>{t('history.detection')}</Chip>
            <Chip selected={filterType === 'learning'} onPress={() => setFilterType('learning')} style={styles.chip}>{t('history.learning')}</Chip>
            <Chip selected={filterType === 'test'} onPress={() => setFilterType('test')} style={styles.chip}>{t('history.test')}</Chip>
          </ScrollView>

          <Text variant="labelMedium" style={{ marginBottom: 8, opacity: 0.7 }}>{t('history.sortBy')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, maxHeight: 40 }}>
            <Chip selected={sortBy === 'time_desc'} onPress={() => setSortBy('time_desc')} style={styles.chip}>{t('history.newest')}</Chip>
            <Chip selected={sortBy === 'time_asc'} onPress={() => setSortBy('time_asc')} style={styles.chip}>{t('history.oldest')}</Chip>
            <Chip selected={sortBy === 'count_desc'} onPress={() => setSortBy('count_desc')} style={styles.chip}>{t('history.mostWords')}</Chip>
            <Chip selected={sortBy === 'name_asc'} onPress={() => setSortBy('name_asc')} style={styles.chip}>{t('history.nameAZ')}</Chip>
          </ScrollView>

          <Button mode="contained" onPress={() => setIsFilterVisible(false)} style={{ borderRadius: 8 }}>
            {t('history.done')}
          </Button>
        </Modal>
      </Portal>

      <FlatList
        data={filteredAndSortedHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>{t('history.noHistory')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  chip: {
    marginRight: 8,
  },
  modalContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  }
});

