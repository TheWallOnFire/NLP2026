import * as React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Button, ProgressBar, Badge, IconButton } from 'react-native-paper';
import { ModelPack } from '../../learning/store/useModelStore';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
export const COLUMN_WIDTH = (width - (GRID_PADDING * 3)) / 2;

interface ModelPackItemProps {
  item: ModelPack;
  mode: 'list' | 'grid';
  theme: any;
  packWords: any;
  validationMap: Record<string, boolean>;
  mainTab: 'my-packs' | 'explore';
  onOpen: (pack: ModelPack) => void;
  onDownload: (pack: ModelPack) => void;
  onDelete: (pack: ModelPack) => void;
}

export default function ModelPackItem({
  item, mode, theme, packWords, validationMap, mainTab, onOpen, onDownload, onDelete
}: ModelPackItemProps) {
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

  const isValidated = validationMap[item.id] !== undefined;
  const isValid = validationMap[item.id] === true;
  const isDisabled = mainTab === 'explore' && isValidated && !isValid;

  if (mode === 'grid') {
    return (
      <Card
        key={item.id}
        style={[styles.gridCard, { width: COLUMN_WIDTH, opacity: isDisabled ? 0.4 : 1 }]}
        mode="elevated"
        onPress={(!isDisabled && item.isDownloaded) ? () => onOpen(item) : undefined}
      >
        <View style={styles.gridCardInner}>
          <View style={styles.gridHeaderRow}>
            <Badge size={20} style={[styles.gridBadge, { backgroundColor: isDisabled ? theme.colors.error : theme.colors.secondaryContainer }]}>
              {isDisabled ? '!' : categoryInitial}
            </Badge>
            {item.isDownloaded && (
              <IconButton
                icon="delete-outline"
                size={18}
                iconColor={theme.colors.error}
                onPress={() => onDelete(item)}
                style={styles.gridDeleteBtn}
                disabled={isDisabled}
              />
            )}
          </View>
          <Text variant="titleSmall" numberOfLines={1} style={[styles.gridTitle, { textDecorationLine: isDisabled ? 'line-through' : 'none' }]}>{name}</Text>
          <Text variant="bodySmall" style={styles.gridSubtitle}>{isDisabled ? 'Invalid Content' : `${wordCount} signs`}</Text>

          {item.isDownloaded ? (
            <View style={styles.gridProgressContainer}>
              <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.gridProgressBar} />
              <Text variant="labelSmall">{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
            </View>
          ) : (
            <Button
              mode="contained-tonal"
              compact
              onPress={() => onDownload(item)}
              style={styles.gridDownloadBtn}
              labelStyle={{ fontSize: 10 }}
              disabled={isDisabled}
            >
              {isDisabled ? 'Locked' : 'Get'}
            </Button>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card
      key={item.id}
      style={[styles.listCard, { opacity: isDisabled ? 0.4 : 1 }]}
      mode="outlined"
      onPress={(!isDisabled && item.isDownloaded) ? () => onOpen(item) : undefined}
    >
      <View style={styles.listCardInner}>
        <View style={styles.listMainInfo}>
          <Text variant="titleMedium" style={{ textDecorationLine: isDisabled ? 'line-through' : 'none' }}>{name}</Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: isDisabled ? theme.colors.error : 'gray' }}>
            {isDisabled ? 'Error: Data structure is invalid or missing' : description}
          </Text>
        </View>

        <View style={styles.listSideInfo}>
          {item.isDownloaded ? (
            <View style={styles.listActionRow}>
              <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>{Math.round((isNaN(progress) ? 0 : progress) * 100)}%</Text>
                <ProgressBar progress={isNaN(progress) ? 0 : progress} color={theme.colors.primary} style={styles.listProgressBar} />
              </View>
              <IconButton
                icon="delete-outline"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => onDelete(item)}
                disabled={isDisabled}
              />
            </View>
          ) : (
            <Button mode="contained-tonal" compact onPress={() => onDownload(item)} disabled={isDisabled}>
              {isDisabled ? 'Locked' : 'Get'}
            </Button>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    borderRadius: 12,
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
  gridDeleteBtn: {
    margin: -8,
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
  gridDownloadBtn: {
    marginTop: 4,
  },
  listCard: {
    borderRadius: 12,
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
