import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Badge, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useHistoryStore } from '../store/useHistoryStore';

export default function HistoryDetailScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { historyId } = route.params || {};

  const historyItem = useHistoryStore((state) => 
    state.history.find(h => h.id === historyId)
  );

  if (!historyItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="titleLarge">Không tìm thấy dữ liệu</Text>
        </View>
      </SafeAreaView>
    );
  }

  const signs = historyItem.signs || [historyItem.sign];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>Chi tiết phiên</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{historyItem.sign}</Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7, marginTop: 4 }}>Ngày: {historyItem.date}</Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Bắt đầu lúc: {historyItem.time}</Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Tổng số từ: {signs.length}</Text>
        </View>

        <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
          Các từ đã nhận diện:
        </Text>

        <View style={styles.signsContainer}>
          {signs.map((sign, index) => (
            <Badge 
              key={`${sign}-${index}`}
              size={32}
              style={[
                styles.signBadge, 
                { backgroundColor: theme.colors.primary, color: theme.colors.onPrimary }
              ]}
            >
              {sign}
            </Badge>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 8,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  signsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signBadge: {
    paddingHorizontal: 16,
    fontSize: 16,
  }
});
