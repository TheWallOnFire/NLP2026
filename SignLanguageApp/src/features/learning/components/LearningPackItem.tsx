import * as React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, ProgressBar, Badge, IconButton } from 'react-native-paper';
import { ModelPack } from '../store/useModelStore';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const COLUMN_WIDTH = (width - (GRID_PADDING * 3)) / 2;

interface LearningPackItemProps {
  item: ModelPack;
  mode: 'list' | 'grid';
  theme: any;
  packWords: any;
  onOpen: (pack: ModelPack) => void;
}

export default function LearningPackItem({
  item, mode, theme, packWords, onOpen
}: LearningPackItemProps) {
  let progress = 0;
  try {
    const words = packWords[item.id] || [];
    if (words.length > 0) {
      const learnedCount = words.filter((w: any) => w?.learned).length;
      progress = learnedCount / words.length;
    }
  } catch (e) {
    console.warn(`Error calculating progress for pack ${item.id}:`, e);
  }

  const categoryInitial = item?.category ? item.category[0] : '?';
  const wordCount = item?.wordCount || 0;
  const name = item?.name || 'Unknown Pack';
  const description = item?.description || 'No description available.';

  if (mode === 'grid') {
    return (
      <Card
        key={item.id}
        style={[styles.gridCard, { width: COLUMN_WIDTH }]}
        mode="elevated"
        onPress={() => onOpen(item)}
      >
        <View style={styles.gridCardInner}>
          <View style={styles.gridHeaderRow}>
            <Badge size={20} style={[styles.gridBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
              {categoryInitial}
            </Badge>
          </View>
          <Text variant="titleSmall" numberOfLines={1} style={styles.gridTitle}>{name}</Text>
          <Text variant="bodySmall" style={styles.gridSubtitle}>{`${wordCount} signs`}</Text>

          <View style={styles.gridProgressContainer}>
            <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.gridProgressBar} />
            <Text variant="labelSmall">{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card
      key={item.id}
      style={styles.listCard}
      mode="outlined"
      onPress={() => onOpen(item)}
    >
      <View style={styles.listCardInner}>
        <View style={styles.listMainInfo}>
          <Text variant="titleMedium">{name}</Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: 'gray' }}>
            {description}
          </Text>
        </View>

        <View style={styles.listSideInfo}>
          <View style={styles.listActionRow}>
            <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
              <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.listProgressBar} />
            </View>
            <IconButton icon="chevron-right" size={20} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  gridCardInner: {
    padding: 12,
    alignItems: 'center',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  gridBadge: {
    alignSelf: 'center',
  },
  gridTitle: {
    marginTop: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  gridSubtitle: {
    color: 'gray',
    marginBottom: 8,
  },
  gridProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  gridProgressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  listCardInner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  listSideInfo: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  listActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listProgressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
