import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Switch, List, useTheme, Divider } from 'react-native-paper';
import { useSettingsStore } from '../store/useSettingsStore';
import SettingsToggleItem from '../components/SettingsToggleItem';

export default function SettingsScreen() {
  const theme = useTheme();
  
  const { 
    isDarkMode, toggleDarkMode, 
    soundEnabled, toggleSound, 
    hapticsEnabled, toggleHaptics 
  } = useSettingsStore();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <SettingsToggleItem
          title="Dark Mode"
          description="Toggle dark and light themes"
          icon="theme-light-dark"
          value={isDarkMode}
          onValueChange={toggleDarkMode}
        />
      </List.Section>
      
      <Divider />

      <List.Section>
        <List.Subheader>Feedback</List.Subheader>
        <SettingsToggleItem
          title="Sound Effects"
          description="Play sounds on correct/incorrect signs"
          icon="volume-high"
          value={soundEnabled}
          onValueChange={toggleSound}
        />
        <SettingsToggleItem
          title="Haptics"
          description="Vibrate on correct/incorrect signs"
          icon="vibrate"
          value={hapticsEnabled}
          onValueChange={toggleHaptics}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Data & Models</List.Subheader>
        <List.Item
          title="Model Packs"
          description="Manage downloaded sign languages"
          left={(props) => <List.Icon {...props} icon="database" />}
          onPress={() => console.log('Open Model Packs')}
        />
        <List.Item
          title="Export Data"
          description="Save your learning history to CSV"
          left={(props) => <List.Icon {...props} icon="export" />}
          onPress={() => console.log('Export Data')}
        />
      </List.Section>
      
      <Divider />

      <List.Section>
        <List.Subheader>Developer</List.Subheader>
        <SettingsToggleItem
          title="Debug Mode"
          description="Enable verbose logging"
          icon="bug"
          value={false}
          onValueChange={() => {}}
        />
      </List.Section>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

