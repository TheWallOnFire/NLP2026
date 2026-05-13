import * as React from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, useTheme, ProgressBar, Badge } from 'react-native-paper';
import { useModelStore, ModelPack } from '../store/useModelStore';
import { useLearningStore } from '../store/useLearningStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';

export default function ModelPacksScreen({ navigation }: any) {
  const theme = useTheme();
  const packs = useModelStore(state => state.packs);
  const downloadPack = useModelStore(state => state.downloadPack);
  const setActivePack = useModelStore(state => state.setActivePack);
  
  const packWords = useLearningStore(state => state.packWords);

  const handleOpenPack = (pack: ModelPack) => {
    triggerSelectionFeedback();
    setActivePack(pack.id);
    navigation.navigate(ROUTES.PACK_DETAIL, { packId: pack.id });
  };

  const renderPackItem = ({ item }: { item: ModelPack }) => {
    const words = packWords[item.id] || [];
    const progress = words.length > 0 ? words.filter(w => w.learned).length / words.length : 0;
    
    return (
      <Card style={styles.card} mode="elevated" onPress={item.isDownloaded ? () => handleOpenPack(item) : undefined}>
        <Card.Title 
          title={item.name} 
          subtitle={item.description}
          right={() => (
            <Badge style={[styles.badge, { backgroundColor: theme.colors.secondaryContainer, color: theme.colors.onSecondaryContainer }]}>
              {item.category}
            </Badge>
          )}
        />
        <Card.Content>
          <View style={styles.packInfo}>
            <Text variant="bodySmall">{item.wordCount} words • v{item.version}</Text>
            {item.isDownloaded && (
              <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                {Math.round(progress * 100)}% Learned
              </Text>
            )}
          </View>
          {item.isDownloaded && (
            <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
          )}
        </Card.Content>
        <Card.Actions>
          {!item.isDownloaded ? (
            <Button mode="contained" onPress={() => downloadPack(item.id)}>Download</Button>
          ) : (
            <Button mode="outlined" onPress={() => handleOpenPack(item)}>Open</Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  const downloadedPacks = packs.filter(p => p.isDownloaded);
  const availablePacks = packs.filter(p => !p.isDownloaded);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>My Packs</Text>
        {downloadedPacks.length > 0 ? (
          downloadedPacks.map(pack => <View key={pack.id}>{renderPackItem({ item: pack })}</View>)
        ) : (
          <Text variant="bodyMedium" style={styles.emptyText}>You haven't downloaded any packs yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Explore More</Text>
        {availablePacks.map(pack => <View key={pack.id}>{renderPackItem({ item: pack })}</View>)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  packInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  badge: {
    marginRight: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    color: 'gray',
  },
});
