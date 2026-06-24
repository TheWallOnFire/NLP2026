import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../../constants/routes';
import { HistoryItem } from '../store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';

interface Props {
  item: HistoryItem;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'detection': return 'camera';
    case 'learning': return 'book-open-page-variant';
    case 'test': return 'gamepad-variant';
    default: return 'history';
  }
};

export default function HistoryTimelineItem({ item }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const getPackName = useModelStore(state => {
    if (item.packId) {
      const pack = state.packs.find(p => p.id === item.packId);
      return pack?.name || 'Phiên nhận diện';
    }
    return 'Phiên nhận diện';
  });

  const handlePress = () => {
    if (item.type === 'detection') {
      navigation.navigate(ROUTES.HISTORY_DETAIL, { historyId: item.id });
    }
  };

  const getSubtitle = () => {
    if (item.type === 'detection' && item.signs) {
      const topSigns = item.signs.slice(0, 5).join(', ');
      const moreText = item.signs.length > 5 ? '...' : '';
      return `${item.date} lúc ${item.time} • ${topSigns}${moreText}`;
    }
    return `${item.date} lúc ${item.time} • ${item.type.toUpperCase()}`;
  };

  return (
    <Card style={styles.card} mode="outlined" onPress={handlePress}>
      <Card.Title
        title={item.type === 'detection' ? `Model: ${getPackName} (${item.signs?.length || 0} từ)` : `Sign: ${item.sign}`}
        subtitle={getSubtitle()}
        left={(props) => <Avatar.Icon {...props} icon={getIcon(item.type)} style={{ backgroundColor: theme.colors.primary }} />}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
});
