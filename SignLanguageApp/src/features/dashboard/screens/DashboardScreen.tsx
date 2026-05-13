import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, useTheme, Avatar, List, IconButton } from 'react-native-paper';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { ROUTES } from '../../../constants/routes';
import { LayoutGrid, Camera, GraduationCap, History as HistoryIcon, TrendingUp } from 'lucide-react-native';

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const packs = useModelStore(state => state.packs);
  const packWords = useLearningStore(state => state.packWords);
  const history = useHistoryStore(state => state.history);

  const downloadedPacks = packs.filter(p => p.isDownloaded);
  const totalWords = Object.values(packWords).flat().length;
  const learnedWords = Object.values(packWords).flat().filter(w => w.learned).length;
  const overallProgress = totalWords > 0 ? learnedWords / totalWords : 0;

  const recentHistory = history.slice(0, 3);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.welcomeText}>Hello, Signer!</Text>
          <Text variant="bodyLarge" style={{ opacity: 0.7 }}>Ready to master some new signs today?</Text>
        </View>
        <Avatar.Icon size={48} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
      </View>

      {/* Progress Overview Card */}
      <Card style={[styles.progressCard, { backgroundColor: theme.colors.primary }]}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <View>
              <Text variant="titleMedium" style={{ color: 'white' }}>Overall Progress</Text>
              <Text variant="displaySmall" style={{ color: 'white', fontWeight: 'bold' }}>
                {Math.round(overallProgress * 100)}%
              </Text>
            </View>
            <TrendingUp color="white" size={40} opacity={0.5} />
          </View>
          <View style={styles.statRow}>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{learnedWords} signs mastered</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{downloadedPacks.length} packs active</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
            onPress={() => navigation.navigate(ROUTES.DETECTION)}
          >
            <Camera color={theme.colors.onSecondaryContainer} size={28} />
            <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onSecondaryContainer }}>Detection</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.tertiaryContainer }]}
            onPress={() => navigation.navigate(ROUTES.LEARNING_TAB)}
          >
            <GraduationCap color={theme.colors.onTertiaryContainer} size={28} />
            <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onTertiaryContainer }}>Learn</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => navigation.navigate(ROUTES.HISTORY)}
          >
            <HistoryIcon color={theme.colors.onSurfaceVariant} size={28} />
            <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Activity</Text>
          <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.HISTORY)}>View All</Button>
        </View>
        
        {recentHistory.length > 0 ? (
          recentHistory.map((item, index) => (
            <Card key={index} style={styles.activityCard} mode="outlined">
              <List.Item
                title={item.sign}
                description={`${item.date} • ${item.time}`}
                left={props => <List.Icon {...props} icon={item.type === 'test' ? 'clipboard-text' : 'camera'} />}
                right={props => item.type === 'test' && <Text style={styles.testBadge}>Test</Text>}
              />
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity yet. Start detection or learning!</Text>
        )}
      </View>

      {/* My Active Packs */}
      {downloadedPacks.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Continue Learning</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packsScroll}>
            {downloadedPacks.map(pack => (
              <Card 
                key={pack.id} 
                style={styles.packCard} 
                onPress={() => navigation.navigate(ROUTES.LEARNING_TAB, { screen: ROUTES.PACK_DETAIL, params: { packId: pack.id } })}
              >
                <Card.Content style={styles.packCardContent}>
                  <Avatar.Text size={32} label={pack.name[0]} style={{ backgroundColor: theme.colors.primaryContainer }} />
                  <Text variant="titleSmall" numberOfLines={1} style={{ marginTop: 8 }}>{pack.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                    {Math.round((packWords[pack.id]?.filter(w => w.learned).length / packWords[pack.id]?.length) * 100 || 0)}%
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontWeight: 'bold',
  },
  progressCard: {
    margin: 16,
    borderRadius: 24,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
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
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    width: '31%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  testBadge: {
    alignSelf: 'center',
    fontSize: 10,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    color: '#1976D2',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 20,
  },
  packsScroll: {
    marginTop: 8,
  },
  packCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 16,
  },
  packCardContent: {
    alignItems: 'center',
    padding: 12,
  },
});
