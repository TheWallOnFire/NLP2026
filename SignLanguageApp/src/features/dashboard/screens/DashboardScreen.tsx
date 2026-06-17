import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, BackHandler, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Avatar, List, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useUserStore } from '../../profile/store/useUserStore';
import { ROUTES } from '../../../constants/routes';
import { LayoutGrid, Camera, GraduationCap, History as HistoryIcon, TrendingUp, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const packs = useModelStore(state => state.packs);
  const packWords = useLearningStore(state => state.packWords);
  const history = useHistoryStore(state => state.history);
  const { profile } = useUserStore();

  const downloadedPacks = React.useMemo(() => packs.filter(p => p.isDownloaded), [packs]);
  
  const stats = React.useMemo(() => {
    const allWords = Object.values(packWords).flat();
    const total = allWords.length;
    const learned = allWords.filter(w => w.learned).length;
    return {
      total,
      learned,
      progress: total > 0 ? learned / total : 0
    };
  }, [packWords]);

  const recentHistory = React.useMemo(() => history.slice(0, 3), [history]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
          ],
          { cancelable: true }
        );
        return true; // prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={styles.welcomeText}>Hello, {profile.name.split(' ')[0]}!</Text>
          <Text variant="bodyLarge" style={{ opacity: 0.7 }}>Ready to master some new signs today?</Text>
        </View>
        <Avatar.Icon size={48} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
      </View>

      {/* Progress Banner */}
      <View style={{ paddingHorizontal: 16 }}>
        <LinearGradient 
          colors={['#4facfe', '#00f2fe']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text variant="titleMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>Overall Progress</Text>
              <Text variant="displaySmall" style={{ color: 'white', fontWeight: 'bold' }}>
                {Math.round(stats.progress * 100)}%
              </Text>
            </View>
            <Sparkles color="white" size={32} opacity={0.8} />
          </View>
          <View style={styles.statRow}>
            <View>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{stats.learned}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Learned</Text>
            </View>
            <View>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{stats.total}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Total Words</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

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
            onPress={() => navigation.navigate(ROUTES.PROFILE_TAB, { screen: ROUTES.HISTORY })}
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
          <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.PROFILE_TAB, { screen: ROUTES.HISTORY })}>View All</Button>
        </View>
        
        {recentHistory.length > 0 ? (
          recentHistory.map((item, index) => (
            <Card key={item.id} style={styles.activityCard} mode="outlined">
              <List.Item
                title={item.sign}
                description={`${item.date} • ${item.time}`}
                left={props => <List.Icon {...props} icon={item.type === 'test' ? 'clipboard-text' : 'camera'} />}
                right={props => item.type === 'test' && <View style={styles.testBadgeContainer}><Text style={styles.testBadge}>Test</Text></View>}
              />
            </Card>
          ))
        ) : (
          <Card mode="contained" style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No recent activity yet. Start detection or learning to see your progress here!</Text>
              <Button mode="contained-tonal" onPress={() => navigation.navigate(ROUTES.DETECTION)} style={{ marginTop: 8 }}>
                Try Detection
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* My Active Packs */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Continue Learning</Text>
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
                  onPress={() => navigation.navigate(ROUTES.LEARNING_TAB, { screen: ROUTES.PACK_DETAIL, params: { packId: pack.id } })}
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
              <Text style={styles.emptyText}>You haven't added any learning packs yet.</Text>
              <Button mode="contained-tonal" onPress={() => navigation.navigate(ROUTES.LEARNING_TAB)} style={{ marginTop: 8 }}>
                Browse Library
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    overflow: 'hidden',
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
