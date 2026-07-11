import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../src/constants/routes';

interface DashboardRecentActivityProps {
  recentHistory: any[];
  navigation: any;
}

export default function DashboardRecentActivity({
  recentHistory,
  navigation
}: DashboardRecentActivityProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
        <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.HISTORY)}>
          {t('dashboard.viewAll')}
        </Button>
      </View>
      
      {recentHistory.length > 0 ? (
        <FlatList
          data={recentHistory}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const formattedDate = !isNaN(Date.parse(item.date)) ? new Date(item.date).toLocaleDateString() : item.date;
            const formattedTime = !isNaN(Date.parse(item.time)) ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.time;
            return (
              <Card style={styles.activityCard} mode="outlined">
                <List.Item
                  title={item.sign}
                  description={`${formattedDate} • ${formattedTime}`}
                  left={props => <List.Icon {...props} icon={item.type === 'test' ? 'clipboard-text' : 'camera'} />}
                  right={props => item.type === 'test' && <View style={styles.testBadgeContainer}><Text style={styles.testBadge}>Test</Text></View>}
                />
              </Card>
            );
          }}
        />
      ) : (
        <Card mode="contained" style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>{t('dashboard.noRecentActivity')}</Text>
            <Button mode="contained-tonal" onPress={() => navigation.navigate(ROUTES.DETECTION)} style={{ marginTop: 8 }}>
              {t('dashboard.tryDetection')}
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  activityCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  emptyCard: {
    borderRadius: 16,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: 12,
    lineHeight: 20,
  },
  testBadgeContainer: {
    justifyContent: 'center',
  },
  testBadge: {
    fontSize: 10,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    color: '#1976D2',
  },
});
