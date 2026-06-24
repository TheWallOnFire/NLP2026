import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, BackHandler, Alert, FlatList, RefreshControl, Platform } from 'react-native';
import { Text, Card, Button, useTheme, Avatar, List, IconButton } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { LayoutGrid, Camera, GraduationCap, History as HistoryIcon, TrendingUp, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    profile, refreshing, onRefresh, downloadedPacks, stats, recentHistory, packWords
  } = useDashboardLogic();

  return (
    <ErrorBoundary>
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={styles.welcomeText}>{t('dashboard.hello')}, {profile?.name?.split(' ')[0] || t('dashboard.user')}!</Text>
          <Text variant="bodyLarge" style={{ opacity: 0.7 }}>{t('dashboard.readyToMaster')}</Text>
        </View>
        <Avatar.Icon size={48} icon="account" style={{ backgroundColor: theme.colors.primaryContainer || '#cccccc' }} />
      </View>

      {/* Progress Banner */}
      <View style={{ paddingHorizontal: 16 }}>
        <LinearGradient 
          key={theme.dark ? 'dark' : 'light'}
          colors={theme.dark ? [theme.colors.primary, theme.colors.secondary] : ['#4facfe', '#00f2fe']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text variant="titleMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('dashboard.overallProgress')}</Text>
              <Text variant="displaySmall" style={{ color: 'white', fontWeight: 'bold' }}>
                {Math.round(stats.progress * 100)}%
              </Text>
            </View>
            <Sparkles color="white" size={32} opacity={0.8} />
          </View>
          <View style={styles.statRow}>
            <View>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{stats.learned}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t('dashboard.learned')}</Text>
            </View>
            <View>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{stats.total}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t('dashboard.totalWords')}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
            onPress={() => navigation.navigate(ROUTES.DETECTION)}
            accessibilityLabel="Mở tính năng nhận diện"
            accessibilityRole="button"
          >
            <Camera color={theme.colors.onSecondaryContainer} size={28} />
            <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onSecondaryContainer }}>{t('dashboard.detection')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.tertiaryContainer }]}
            onPress={() => navigation.navigate(ROUTES.LEARNING_TAB)}
            accessibilityLabel="Mở thư viện từ vựng"
            accessibilityRole="button"
          >
            <GraduationCap color={theme.colors.onTertiaryContainer} size={28} />
            <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onTertiaryContainer }}>{t('dashboard.learn')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => navigation.navigate(ROUTES.PROFILE_TAB, { screen: ROUTES.HISTORY })}
            accessibilityLabel="Mở lịch sử học tập"
            accessibilityRole="button"
          >
            <HistoryIcon color={theme.colors.onSurfaceVariant} size={28} />
            <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>{t('dashboard.history')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
          <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.PROFILE_TAB, { screen: ROUTES.HISTORY })}>{t('dashboard.viewAll')}</Button>
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

      {/* My Active Packs */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>{t('dashboard.continueLearning')}</Text>
        {downloadedPacks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packsScroll}>
            {downloadedPacks.map(pack => {
              const packWordsList = packWords[pack.id] || [];
              const packLearned = packWordsList.filter(w => w.learned).length;
              const packProgress = packWordsList.length > 0 ? packLearned / packWordsList.length : 0;
              
              return (
                <Card 
                  key={pack.id} 
                  style={styles.packCard} 
                  onPress={() => navigation.navigate(ROUTES.LEARNING_TAB, { screen: ROUTES.PACK_DETAIL, params: { packId: pack?.id || '' } })}
                >
                  <Card.Content style={styles.packCardContent}>
                    <Avatar.Text size={32} label={pack.name[0]} style={{ backgroundColor: theme.colors.primaryContainer }} />
                    <Text variant="titleSmall" numberOfLines={1} style={{ marginTop: 8 }}>{pack.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      {Math.round(packProgress * 100)}%
                    </Text>
                  </Card.Content>
                </Card>
              );
            })}
          </ScrollView>
        ) : (
          <Card mode="contained" style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>{t('dashboard.noLearningPacks')}</Text>
              <Button mode="contained-tonal" onPress={() => navigation.navigate(ROUTES.LEARNING_TAB)} style={{ marginTop: 8 }}>
                {t('dashboard.browseLibrary')}
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
    </ErrorBoundary>
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 4 : 8,
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
  emptyCard: {
    borderRadius: 16,
    marginTop: 8,
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
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: 12,
    lineHeight: 20,
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
