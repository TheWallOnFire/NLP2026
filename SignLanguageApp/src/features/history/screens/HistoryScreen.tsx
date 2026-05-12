import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useHistoryStore } from '../store/useHistoryStore';
import HistoryTimelineItem from '../components/HistoryTimelineItem';

export default function HistoryScreen() {
  const theme = useTheme();
  const { history, clearHistory } = useHistoryStore();

  const renderItem = ({ item }: { item: any }) => (
    <HistoryTimelineItem item={item} />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="titleMedium">Recent Activity</Text>
        <Button mode="text" onPress={clearHistory} disabled={history.length === 0}>
          Clear
        </Button>
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No history found.</Text>}
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
});

