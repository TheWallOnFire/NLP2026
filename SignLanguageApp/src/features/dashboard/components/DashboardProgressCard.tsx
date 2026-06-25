import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface DashboardProgressCardProps {
  theme: any;
  lastAccessedPack: any;
  packWords: any;
  stats: any;
}

export default function DashboardProgressCard({
  theme,
  lastAccessedPack,
  packWords,
  stats
}: DashboardProgressCardProps) {
  const { t } = useTranslation();

  return (
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
            <Text variant="titleMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {lastAccessedPack ? lastAccessedPack.name : t('dashboard.overallProgress')}
            </Text>
            <Text variant="displaySmall" style={{ color: 'white', fontWeight: 'bold' }}>
              {lastAccessedPack ? 
                Math.round((packWords[lastAccessedPack.id]?.filter((w: any) => w.learned).length || 0) / (packWords[lastAccessedPack.id]?.length || 1) * 100) 
                : Math.round(stats.progress * 100)}%
            </Text>
          </View>
          <Sparkles color="white" size={32} opacity={0.8} />
        </View>
        <View style={styles.statRow}>
          <View>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {lastAccessedPack ? (packWords[lastAccessedPack.id]?.filter((w: any) => w.learned).length || 0) : stats.learned}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t('dashboard.learned')}</Text>
          </View>
          <View>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {lastAccessedPack ? (packWords[lastAccessedPack.id]?.length || 0) : stats.total}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t('dashboard.totalWords')}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
