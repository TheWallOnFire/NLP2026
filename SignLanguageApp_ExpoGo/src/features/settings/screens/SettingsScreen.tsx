import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, useTheme, Card, Divider, Switch, IconButton } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { ChevronRight, Check, Sun, Volume2, Camera, Vibrate, HardDrive, Bell, Bug, Database, Download, Cpu, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSettingsStore } from '../store/useSettingsStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useUserStore } from '../../profile/store/useUserStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';

export default function SettingsScreen({ navigation }: any) {
  const theme = useTheme();
  
  const settings = useSettingsStore();
  const { updateSettings } = settings;
  const { clearHistory } = useHistoryStore();

  const resetPacks = useModelStore(state => state.resetPacks);
  const resetProfile = useUserStore(state => state.resetProfile);
  const resetAllProgress = useLearningStore(state => state.resetAllProgress);

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Delete all activity history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearHistory }
      ]
    );
  };

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card mode="contained" style={styles.menuCard}>
          <List.Section>
            {/* 1. Theme */}
            <List.Accordion
              title="Theme"
              description={`Current: ${settings.theme}`}
              left={props => <List.Icon {...props} icon={() => <Sun size={24} color={theme.colors.primary} />} />}
            >
              <List.Item 
                title="Light" 
                onPress={() => updateSettings({ theme: 'light' })}
                right={props => settings.theme === 'light' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <List.Item 
                title="Dark" 
                onPress={() => updateSettings({ theme: 'dark' })}
                right={props => settings.theme === 'dark' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <List.Item 
                title="Mixed" 
                onPress={() => updateSettings({ theme: 'mixed' })}
                right={props => settings.theme === 'mixed' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
            </List.Accordion>
            <Divider />

            {/* 2. Sound & Voice */}
            <List.Accordion
              title="Sound & Voice"
              description="System sounds and TTS"
              left={props => <List.Icon {...props} icon={() => <Volume2 size={24} color={theme.colors.primary} />} />}
            >
              <List.Item 
                title="System Sounds" 
                right={() => <Switch value={settings.sound.systemSounds} onValueChange={(val) => updateSettings({ sound: { ...settings.sound, systemSounds: val } })} />}
              />
              <List.Item 
                title="Learning Feedback" 
                right={() => <Switch value={settings.sound.learningFeedback} onValueChange={(val) => updateSettings({ sound: { ...settings.sound, learningFeedback: val } })} />}
              />
              <List.Item 
                title="Capture Notification" 
                right={() => <Switch value={settings.sound.captureNotification} onValueChange={(val) => updateSettings({ sound: { ...settings.sound, captureNotification: val } })} />}
              />
            </List.Accordion>
            <Divider />

            {/* 3. Camera */}
            <List.Item
              title="Camera Options"
              left={props => <List.Icon {...props} icon={() => <Camera size={24} color={theme.colors.primary} />} />}
              right={props => <ChevronRight size={24} color={theme.colors.onSurfaceVariant} />}
            />
            <Divider />

            {/* 4. Haptics */}
            <List.Item
              title="Haptic Feedback"
              left={props => <List.Icon {...props} icon={() => <Vibrate size={24} color={theme.colors.primary} />} />}
              right={() => <Switch value={settings.haptics} onValueChange={(val) => updateSettings({ haptics: val })} />}
            />
            <Divider />

            {/* 5. Storage */}
            <List.Accordion
              title="Storage & Data"
              description="Manage history and exports"
              left={props => <List.Icon {...props} icon={() => <HardDrive size={24} color={theme.colors.primary} />} />}
            >
              <List.Item 
                title="Local Logging" 
                right={() => <Switch value={settings.storage.localLogging} onValueChange={(val) => updateSettings({ storage: { ...settings.storage, localLogging: val } })} />}
              />
              <List.Item 
                title="Export Data (CSV)" 
                left={props => <List.Icon {...props} icon={() => <Download size={20} color={theme.colors.primary} />} />}
                onPress={() => Alert.alert("Export", "Data exported to CSV")}
              />
              <List.Item 
                title="Delete All Data"
                titleStyle={{ color: 'red' }} 
                left={props => <List.Icon {...props} icon={() => <Database size={20} color="red" />} />}
                onPress={confirmClearHistory}
              />
            </List.Accordion>
            <Divider />

            {/* 6. Model */}
            <List.Item
              title="Model Pack"
              description="Select active AI model"
              left={props => <List.Icon {...props} icon={() => <Cpu size={24} color={theme.colors.primary} />} />}
              right={props => <ChevronRight size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={() => navigation.navigate(ROUTES.MODEL_PACKS)}
            />
            <Divider />

            {/* 7. System & Alerts */}
            <List.Accordion
              title="System & Alerts"
              left={props => <List.Icon {...props} icon={() => <Bell size={24} color={theme.colors.primary} />} />}
            >
              <List.Item 
                title="Daily Reminders" 
                right={() => <Switch value={settings.systemAlerts.dailyReminders} onValueChange={(val) => updateSettings({ systemAlerts: { ...settings.systemAlerts, dailyReminders: val } })} />}
              />
              <List.Item 
                title="Battery Saver Mode" 
                right={() => <Switch value={settings.systemAlerts.powerManagement} onValueChange={(val) => updateSettings({ systemAlerts: { ...settings.systemAlerts, powerManagement: val } })} />}
              />
            </List.Accordion>
            <Divider />

            {/* 8. Developer Debug Mode */}
            <List.Item
              title="Developer Debug Mode"
              description="Enable verbose logging"
              left={props => <List.Icon {...props} icon={() => <Bug size={24} color={theme.colors.primary} />} />}
              right={() => <Switch value={settings.developerDebugMode} onValueChange={(val) => updateSettings({ developerDebugMode: val })} />}
            />

          </List.Section>
        </Card>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  dangerZone: {
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
