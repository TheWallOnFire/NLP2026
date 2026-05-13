import * as React from 'react';
import { StyleSheet, ScrollView, Alert, View } from 'react-native';
import { List, useTheme, Divider, Button, Text, Card } from 'react-native-paper';
import { useSettingsStore } from '../store/useSettingsStore';
import SettingsToggleItem from '../components/SettingsToggleItem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, User, CircleHelp, AlertTriangle } from 'lucide-react-native';

import { useModelStore } from '../../learning/store/useModelStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useUserStore } from '../../profile/store/useUserStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';

export default function SettingsScreen() {
  const theme = useTheme();
  
  const { 
    isDarkMode, toggleDarkMode, 
    soundEnabled, toggleSound, 
    hapticsEnabled, toggleHaptics,
    debugMode, toggleDebugMode
  } = useSettingsStore();

  const resetPacks = useModelStore(state => state.resetPacks);
  const clearHistory = useHistoryStore(state => state.clearHistory);
  const resetProfile = useUserStore(state => state.resetProfile);
  const resetAllProgress = useLearningStore(state => state.resetAllProgress);

  const handleClearAllData = () => {
    Alert.alert(
      "Reset App Data",
      "This will permanently delete all your learning progress, history, downloaded models, and personalized settings. You will be returned to the initial state.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Reset all in-memory stores
              resetPacks();
              clearHistory();
              resetProfile();
              resetAllProgress();

              // 2. Clear persistence layer
              await AsyncStorage.clear();
              
              triggerSuccessFeedback();
              Alert.alert("Success", "Your application has been reset to factory defaults.");
            } catch (e) {
              Alert.alert("Error", "Failed to clear system storage.");
            }
          }
        }
      ]
    );
  };

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
        <List.Subheader>Account & Security</List.Subheader>
        <List.Item
          title="Personal Information"
          left={props => <List.Icon {...props} icon={() => <User size={20} color={theme.colors.onSurfaceVariant} />} />}
          onPress={() => {}}
        />
        <List.Item
          title="Security"
          left={props => <List.Icon {...props} icon={() => <Shield size={20} color={theme.colors.onSurfaceVariant} />} />}
          onPress={() => {}}
        />
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield-account" />}
          onPress={() => {}}
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
        <List.Subheader>Support</List.Subheader>
        <List.Item
          title="Help Center"
          left={props => <List.Icon {...props} icon={() => <CircleHelp size={20} color={theme.colors.onSurfaceVariant} />} />}
          onPress={() => {}}
        />
        <List.Item
          title="About SignLanguageApp"
          left={props => <List.Icon {...props} icon="information" />}
          onPress={() => {}}
        />
      </List.Section>
      
      <Divider />

      <List.Section>
        <List.Subheader>Developer</List.Subheader>
        <SettingsToggleItem
          title="Debug Mode"
          description="Enable verbose logging"
          icon="bug"
          value={debugMode}
          onValueChange={toggleDebugMode}
        />
      </List.Section>

      <View style={styles.dangerZone}>
        <Text variant="titleSmall" style={[styles.dangerTitle, { color: theme.colors.error }]}>Danger Zone</Text>
        <Card mode="outlined" style={[styles.dangerCard, { borderColor: theme.colors.error }]}>
          <List.Item
            title="Reset All Factory Settings"
            titleStyle={{ color: theme.colors.error, fontWeight: 'bold' }}
            description="Wipe all app data and progress"
            left={props => <List.Icon {...props} icon={() => <AlertTriangle size={24} color={theme.colors.error} />} />}
            onPress={handleClearAllData}
          />
        </Card>
      </View>
      
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.versionText}>Sign Language App v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dangerZone: {
    padding: 16,
    marginTop: 8,
  },
  dangerTitle: {
    marginBottom: 8,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  dangerCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,0,0,0.02)',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  versionText: {
    opacity: 0.4,
  },
});
