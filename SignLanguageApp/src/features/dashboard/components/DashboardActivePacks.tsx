import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../src/constants/routes';

interface DashboardActivePacksProps {
  downloadedPacks: any[];
  packWords: any;
  navigation: any;
}

export default function DashboardActivePacks({
  downloadedPacks,
  packWords,
  navigation
}: DashboardActivePacksProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text variant="titleLarge" style={styles.sectionTitle}>{t('dashboard.continueLearning')}</Text>
      {downloadedPacks.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packsScroll}>
          {downloadedPacks.map(pack => {
            const packWordsList = packWords[pack.id] || [];
            const packLearned = packWordsList.filter((w: any) => w.learned).length;
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
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
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
});
