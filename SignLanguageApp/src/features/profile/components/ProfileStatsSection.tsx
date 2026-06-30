import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Info, User as UserIcon, Briefcase, Heart, Award, Flame, Clock } from 'lucide-react-native';

interface ProfileStatsSectionProps {
  profile: any;
  learnedCount: number;
  favoriteCount: number;
  streakDays: number;
}

export default function ProfileStatsSection({
  profile,
  learnedCount,
  favoriteCount,
  streakDays
}: ProfileStatsSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const BulletItem = ({ label, value, icon }: { label: string, value: string, icon?: any }) => (
    <View style={styles.bulletItem}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
        {icon}
      </View>
      <View style={styles.bulletTextContainer}>
        <Text variant="labelMedium" style={styles.bulletLabel}>{label}</Text>
        <Text variant="bodyLarge" style={styles.bulletValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.statsSection}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        {t('profile.activityStats')}
      </Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.gridCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.gridCardContent}>
            <Award size={24} color={theme.colors.primary} />
            <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.primary }]}>{learnedCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>{t('profile.learnedWords')}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.gridCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.gridCardContent}>
            <Heart size={24} color={theme.colors.error} />
            <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.primary }]}>{favoriteCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>{t('profile.favoriteWords')}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.gridCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.gridCardContent}>
            <Clock size={24} color={theme.colors.secondary} />
            <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.primary }]}>{Math.round((profile.learningTime || 0) / 60)}h</Text>
            <Text variant="labelSmall" style={styles.statLabel}>{t('profile.learningTime')}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.gridCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.gridCardContent}>
            <Flame size={24} color="#FF6B6B" />
            <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.primary }]}>{streakDays}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>{t('profile.streakDays')}</Text>
          </Card.Content>
        </Card>
      </View>

      <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 28, color: theme.colors.primary }]}>
        {t('profile.aboutMe')}
      </Text>
      
      <Card style={styles.infoCard} mode="elevated" elevation={1}>
        <Card.Content style={styles.infoCardContent}>
          <BulletItem label={t('profile.birth')} value={profile.birth || 'N/A'} icon={<UserIcon size={20} color={theme.colors.primary} />} />
          <View style={styles.divider} />
          <BulletItem label={t('profile.bio')} value={profile.bio || 'N/A'} icon={<Info size={20} color={theme.colors.primary} />} />
          <View style={styles.divider} />
          <BulletItem label={t('profile.goals')} value={profile.learningGoal || 'N/A'} icon={<Briefcase size={20} color={theme.colors.primary} />} />
          <View style={styles.divider} />
          <BulletItem label={t('profile.motivation')} value={profile.motivation || 'N/A'} icon={<Heart size={20} color={theme.colors.primary} />} />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: '800',
    marginLeft: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  gridCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontWeight: '900',
    marginTop: 8,
  },
  statLabel: {
    opacity: 0.6,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  infoCardContent: {
    paddingVertical: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletLabel: {
    opacity: 0.5,
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  bulletValue: {
    fontWeight: '600',
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 60,
  }
});
