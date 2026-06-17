import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Avatar, useTheme } from 'react-native-paper';
import { HistoryItem } from '../store/useHistoryStore';

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

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Title
        title={`Sign: ${item.sign}`}
        subtitle={`${item.date} at ${item.time} • ${item.type.toUpperCase()}`}
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
