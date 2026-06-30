import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { Camera, GraduationCap, History as HistoryIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

import DashboardProgressCard from '../components/DashboardProgressCard';
import DashboardRecentActivity from '../components/DashboardRecentActivity';
import DashboardActivePacks from '../components/DashboardActivePacks';

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    profile, refreshing, onRefresh, downloadedPacks, stats, recentHistory, packWords, lastAccessedPack
  } = useDashboardLogic();

  return (
    <ErrorBoundary>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium" style={styles.welcomeText}>
              {t('dashboard.hello')}, {profile?.name?.split(' ').slice(0, 3).join(' ') || t('dashboard.user')}!
            </Text>
            <Text variant="bodyLarge" style={{ opacity: 0.7 }}>{t('dashboard.readyToMaster')}</Text>
          </View>
          <View style={{
            padding: 3,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.background,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}>
            {profile?.avatar ? (
              <Avatar.Image size={48} source={{ uri: profile.avatar }} style={{ backgroundColor: theme.colors.primaryContainer || '#cccccc' }} />
            ) : (
              <Avatar.Icon size={48} icon="account" style={{ backgroundColor: theme.colors.primaryContainer || '#cccccc' }} />
            )}
          </View>
        </View>

        <DashboardProgressCard 
          theme={theme}
          lastAccessedPack={lastAccessedPack}
          packWords={packWords}
          stats={stats}
        />

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
              onPress={() => navigation.navigate(ROUTES.DETECTION)}
            >
              <Camera color={theme.colors.onSecondaryContainer} size={28} />
              <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onSecondaryContainer }}>{t('dashboard.detection')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.tertiaryContainer }]}
              onPress={() => navigation.navigate(ROUTES.LEARNING_TAB)}
            >
              <GraduationCap color={theme.colors.onTertiaryContainer} size={28} />
              <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onTertiaryContainer }}>{t('dashboard.learn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => navigation.navigate(ROUTES.PROFILE_TAB, { screen: ROUTES.HISTORY })}
            >
              <HistoryIcon color={theme.colors.onSurfaceVariant} size={28} />
              <Text variant="labelLarge" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>{t('dashboard.history')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DashboardRecentActivity 
          recentHistory={recentHistory}
          navigation={navigation}
        />

        <DashboardActivePacks 
          downloadedPacks={downloadedPacks}
          packWords={packWords}
          navigation={navigation}
        />

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
  section: {
    padding: 16,
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
});
