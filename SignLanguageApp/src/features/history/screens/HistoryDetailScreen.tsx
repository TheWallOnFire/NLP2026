import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Badge, IconButton, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, BookOpen, CheckSquare } from 'lucide-react-native';
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

  const signs = historyItem.signs || (historyItem.sign ? [historyItem.sign] : []);

  const getSessionTypeInfo = (type: string) => {
    switch (type) {
      case 'detection':
        return { title: 'Phiên nhận diện', icon: <Camera size={24} color={theme.colors.primary} /> };
      case 'learning':
        return { title: 'Học tập', icon: <BookOpen size={24} color={theme.colors.secondary} /> };
      case 'test':
        return { title: 'Bài kiểm tra', icon: <CheckSquare size={24} color={theme.colors.error} /> };
      default:
        return { title: 'Phiên hoạt động', icon: <BookOpen size={24} color={theme.colors.primary} /> };
    }
  };

  const sessionInfo = getSessionTypeInfo(historyItem.type);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>{sessionInfo.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.infoCard} mode="elevated">
          <Card.Title 
            title={historyItem.sign} 
            titleStyle={{ fontWeight: 'bold' }}
            left={() => sessionInfo.icon}
          />
          <Card.Content>
            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Ngày:</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{historyItem.date}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Bắt đầu lúc:</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{historyItem.time}</Text>
            </View>
            {historyItem.type === 'test' ? (
              <View style={styles.metricRow}>
                <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Điểm số:</Text>
                <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>{signs.length} / {signs.length}</Text>
              </View>
            ) : (
              <View style={styles.metricRow}>
                <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Tổng số từ:</Text>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{signs.length}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
          {historyItem.type === 'test' ? 'Các từ trả lời đúng:' : 'Các từ đã nhận diện:'}
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
    borderRadius: 16,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  signsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 8,
  }
});
