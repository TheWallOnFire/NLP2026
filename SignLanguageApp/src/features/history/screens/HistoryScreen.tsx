import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, useTheme, Button, Chip, Portal, Modal, IconButton } from 'react-native-paper';
import { Filter } from 'lucide-react-native';
import { useHistoryStore } from '../store/useHistoryStore';
import HistoryTimelineItem from '../components/HistoryTimelineItem';

export default function HistoryScreen() {
  const theme = useTheme();
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
      if (sortBy === 'time_desc') {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortBy === 'time_asc') {
        return (a.timestamp || 0) - (b.timestamp || 0);
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
      "Xóa lịch sử",
      "Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: clearHistory }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="titleMedium">Toàn bộ lịch sử</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon={() => <Filter size={20} color={theme.colors.primary} />} onPress={() => setIsFilterVisible(true)} />
          <Button mode="text" onPress={confirmClearHistory} disabled={history.length === 0} textColor="red">
            Xóa
          </Button>
        </View>
      </View>

      <Portal>
        <Modal visible={isFilterVisible} onDismiss={() => setIsFilterVisible(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={{ marginBottom: 16, fontWeight: 'bold' }}>Bộ lọc Lịch sử</Text>
          
          <Text variant="labelMedium" style={{ marginBottom: 8, opacity: 0.7 }}>Lọc theo:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, maxHeight: 40 }}>
            <Chip selected={filterType === 'all'} onPress={() => setFilterType('all')} style={styles.chip}>Tất cả</Chip>
            <Chip selected={filterType === 'detection'} onPress={() => setFilterType('detection')} style={styles.chip}>Nhận diện</Chip>
            <Chip selected={filterType === 'learning'} onPress={() => setFilterType('learning')} style={styles.chip}>Học tập</Chip>
            <Chip selected={filterType === 'test'} onPress={() => setFilterType('test')} style={styles.chip}>Bài tập</Chip>
          </ScrollView>

          <Text variant="labelMedium" style={{ marginBottom: 8, opacity: 0.7 }}>Sắp xếp:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, maxHeight: 40 }}>
            <Chip selected={sortBy === 'time_desc'} onPress={() => setSortBy('time_desc')} style={styles.chip}>Mới nhất</Chip>
            <Chip selected={sortBy === 'time_asc'} onPress={() => setSortBy('time_asc')} style={styles.chip}>Cũ nhất</Chip>
            <Chip selected={sortBy === 'count_desc'} onPress={() => setSortBy('count_desc')} style={styles.chip}>Nhiều từ nhất</Chip>
            <Chip selected={sortBy === 'name_asc'} onPress={() => setSortBy('name_asc')} style={styles.chip}>Tên A-Z</Chip>
          </ScrollView>

          <Button mode="contained" onPress={() => setIsFilterVisible(false)} style={{ borderRadius: 8 }}>
            Xong
          </Button>
        </Modal>
      </Portal>

      <FlatList
        data={filteredAndSortedHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Không tìm thấy lịch sử.</Text>}
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

