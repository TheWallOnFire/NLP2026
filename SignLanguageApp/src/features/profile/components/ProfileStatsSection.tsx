import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Info, User as UserIcon, Briefcase, Heart, Dot } from 'lucide-react-native';

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
      {icon ? icon : <Dot size={20} color={theme.colors.primary} />}
      <Text variant="bodyMedium" style={styles.bulletLabel}>{label}:</Text>
      <Text variant="bodyMedium" style={styles.bulletValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.statsSection}>
      <Text variant="titleLarge" style={styles.sectionTitle}>{t('profile.activityStats')}</Text>
      
      <Card style={styles.statsCard} mode="outlined">
        <Card.Content>
          <View style={styles.statRowInsight}>
            <View style={styles.statInsightItem}>
              <Text variant="displaySmall" style={styles.statInsightValue}>{learnedCount}</Text>
              <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.learnedWords')}</Text>
            </View>
            <View style={styles.statDividerVertical} />
            <View style={styles.statInsightItem}>
              <Text variant="displaySmall" style={styles.statInsightValue}>{favoriteCount}</Text>
              <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.favoriteWords')}</Text>
            </View>
          </View>
          <Divider style={{ marginVertical: 16 }} />
          <View style={styles.statRowInsight}>
            <View style={styles.statInsightItem}>
              <Text variant="displaySmall" style={styles.statInsightValue}>{Math.round((profile.learningTime || 0) / 60)}h</Text>
              <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.learningTime')}</Text>
            </View>
            <View style={styles.statDividerVertical} />
            <View style={styles.statInsightItem}>
              <Text variant="displaySmall" style={styles.statInsightValue}>{streakDays}</Text>
              <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.streakDays')}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>{t('profile.aboutMe')}</Text>
      <Card style={styles.infoCard} mode="contained">
        <Card.Content>
          <BulletItem label={t('profile.birth')} value={profile.birth || 'N/A'} icon={<UserIcon size={16} color={theme.colors.primary} />} />
          <BulletItem label={t('profile.bio')} value={profile.bio || 'N/A'} icon={<Info size={16} color={theme.colors.primary} />} />
          <BulletItem label={t('profile.goals')} value={profile.learningGoal || 'N/A'} icon={<Briefcase size={16} color={theme.colors.primary} />} />
          <BulletItem label={t('profile.motivation')} value={profile.motivation || 'N/A'} icon={<Heart size={16} color={theme.colors.primary} />} />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginLeft: 8,
    marginBottom: 8,
    opacity: 0.6,
  },
  statsCard: {
    borderRadius: 16,
    padding: 8,
  },
  statRowInsight: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statInsightItem: {
    alignItems: 'center',
    flex: 1,
  },
  statInsightValue: {
    fontWeight: 'bold',
    color: '#005bea',
  },
  statInsightLabel: {
    opacity: 0.6,
    marginTop: 4,
  },
  statDividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  infoCard: {
    borderRadius: 16,
    paddingVertical: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bulletLabel: {
    fontWeight: 'bold',
    marginLeft: 4,
    width: 130,
  },
  bulletValue: {
    flex: 1,
    opacity: 0.8,
  },
});
