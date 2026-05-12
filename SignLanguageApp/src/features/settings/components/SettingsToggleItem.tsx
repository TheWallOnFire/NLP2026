import React from 'react';
import { Switch, List } from 'react-native-paper';
import { triggerSelectionFeedback } from '../../../utils/feedback';

interface Props {
  title: string;
  description?: string;
  icon: string;
  value: boolean;
  onValueChange: () => void;
}

export default function SettingsToggleItem({ title, description, icon, value, onValueChange }: Props) {
  const handleToggle = () => {
    triggerSelectionFeedback();
    onValueChange();
  };

  return (
    <List.Item
      title={title}
      description={description}
      left={(props) => <List.Icon {...props} icon={icon} />}
      right={() => <Switch value={value} onValueChange={handleToggle} />}
    />
  );
}
