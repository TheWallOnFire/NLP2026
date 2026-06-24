import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, List, useTheme, Card, Divider, Switch, IconButton, ProgressBar } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { ChevronRight, Check, Sun, Volume2, Camera, Vibrate, HardDrive, Bell, Bug, Database, Download, Cpu, AlertTriangle, Settings as SettingsIcon, Shield, Trash2, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../store/useSettingsStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../../learning/store/useModelStore';
import { useUserStore } from '../../profile/store/useUserStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';
import { importCustomPack } from '../../../utils/packImporter';
import * as FileSystem from 'expo-file-system/legacy';

export default function SettingsScreen({ navigation }: any) {
  const theme = useTheme();
  const { t } = useTranslation();

  const settings = useSettingsStore();
  const { updateSettings } = settings;
  const { clearHistory } = useHistoryStore();

  const resetPacks = useModelStore(state => state.resetPacks);
  const importCustomPackAction = useModelStore(state => state.importCustomPack);
  const resetProfile = useUserStore(state => state.resetProfile);
  const resetAllProgress = useLearningStore(state => state.resetAllProgress);
  const initializePackWords = useLearningStore(state => state.initializePackWords);

  const [isImporting, setIsImporting] = React.useState(false);
  const [cacheSize, setCacheSize] = React.useState<string | null>(null);
  const [isClearing, setIsClearing] = React.useState(false);

  const calculateCacheSize = React.useCallback(async () => {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}captured_media/`;
      const info = await FileSystem.getInfoAsync(cacheDir);
      if (!info.exists) {
        setCacheSize('0 KB');
        return;
      }
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalBytes = 0;
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
        if (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size) {
          totalBytes += fileInfo.size;
        }
      }
      if (totalBytes < 1024) setCacheSize(`${totalBytes} B`);
      else if (totalBytes < 1024 * 1024) setCacheSize(`${(totalBytes / 1024).toFixed(1)} KB`);
      else setCacheSize(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
    } catch {
      setCacheSize('N/A');
    }
  }, []);

  React.useEffect(() => {
    calculateCacheSize();
  }, [calculateCacheSize]);

  const handleClearCache = async () => {
    Alert.alert(
      "Xóa Cache",
      "Xóa toàn bộ ảnh/video đã lưu tạm? Thao tác này không ảnh hưởng đến lịch sử nhận diện.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setIsClearing(true);
              const cacheDir = `${FileSystem.cacheDirectory}captured_media/`;
              const info = await FileSystem.getInfoAsync(cacheDir);
              if (info.exists) {
                await FileSystem.deleteAsync(cacheDir, { idempotent: true });
              }
              await calculateCacheSize();
              triggerSuccessFeedback();
              Alert.alert("Thành công", "Đã xóa toàn bộ cache media.");
            } catch (e) {
              Alert.alert("Lỗi", "Không thể xóa cache.");
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const result = await importCustomPack();
      if (result) {
        initializePackWords(result.pack.id, result.words);
        importCustomPackAction(result.pack);
        Alert.alert("Success", `Imported ${result.pack.name} successfully!`);
      }
    } catch (error: any) {
      Alert.alert("Import Failed", error.message || "Failed to import model pack.");
    } finally {
      setIsImporting(false);
    }
  };

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
              settings.resetSettings();

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
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SettingsIcon color="white" size={32} />
        <Text variant="headlineMedium" style={styles.headerTitle}>{t('settings.title')}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Card mode="elevated" style={styles.menuCard}>
          <List.Section>
            
            {/* Language */}
            <List.Accordion
              title={t('settings.language')}
              description={settings.language === 'vi' ? t('settings.vietnamese') : t('settings.english')}
              left={props => <List.Icon {...props} icon={() => <Globe size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.english')}
                onPress={() => updateSettings({ language: 'en' })}
                right={props => settings.language === 'en' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <List.Item
                title={t('settings.vietnamese')}
                onPress={() => updateSettings({ language: 'vi' })}
                right={props => settings.language === 'vi' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
            </List.Accordion>
            <Divider />

            {/* 1. Theme */}
            <List.Accordion
              title={t('settings.theme')}
              description={`${t('settings.current')}: ${t(`settings.${settings.theme}`)}`}
              left={props => <List.Icon {...props} icon={() => <Sun size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.light')}
                onPress={() => updateSettings({ theme: 'light' })}
                right={props => settings.theme === 'light' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <List.Item
                title={t('settings.dark')}
                onPress={() => updateSettings({ theme: 'dark' })}
                right={props => settings.theme === 'dark' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <List.Item
                title={t('settings.mixed')}
                onPress={() => updateSettings({ theme: 'mixed' })}
                right={props => settings.theme === 'mixed' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
            </List.Accordion>
            <Divider />

            {/* 2. Sound & Voice */}
            <List.Accordion
              title={t('settings.soundAndVoice')}
              left={props => <List.Icon {...props} icon={() => <Volume2 size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.systemSounds')}
                right={() => <Switch value={settings.sound.systemSounds} onValueChange={(val) => updateSettings({ sound: { ...settings.sound, systemSounds: val } })} />}
              />
              <List.Item
                title={t('settings.learningFeedback')}
                right={() => <Switch value={settings.sound.learningFeedback} onValueChange={(val) => updateSettings({ sound: { ...settings.sound, learningFeedback: val } })} />}
              />
              <List.Item
                title={t('settings.captureNotification')}
                right={() => <Switch value={settings.sound.captureNotification} onValueChange={(val) => updateSettings({ sound: { ...settings.sound, captureNotification: val } })} />}
              />
            </List.Accordion>
            <Divider />

            {/* 3. Camera & Detection */}
            <List.Accordion
              title={t('settings.cameraAndDetection')}
              description={`${settings.camera?.defaultFacing === 'front' ? t('settings.frontCamera') : t('settings.backCamera')} • ${settings.detection?.speed.toUpperCase()}`}
              left={props => <List.Icon {...props} icon={() => <Camera size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.frontCamera')}
                onPress={() => updateSettings({ camera: { ...settings.camera, defaultFacing: 'front' } })}
                right={props => settings.camera?.defaultFacing === 'front' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <List.Item
                title={t('settings.backCamera')}
                onPress={() => updateSettings({ camera: { ...settings.camera, defaultFacing: 'back' } })}
                right={props => settings.camera?.defaultFacing === 'back' ? <Check size={20} color={theme.colors.primary} /> : null}
              />
              <Divider style={{ marginVertical: 8 }} />
              <List.Subheader>{t('settings.detectionSpeed')}</List.Subheader>
              {(['slow', 'normal', 'fast', 'off'] as const).map(speed => (
                <List.Item
                  key={speed}
                  title={speed.toUpperCase()}
                  onPress={() => updateSettings({ detection: { ...settings.detection, speed } })}
                  right={props => settings.detection?.speed === speed ? <Check size={20} color={theme.colors.primary} /> : null}
                />
              ))}
            </List.Accordion>
            <Divider />

            {/* 4. Haptics */}
            <List.Item
              title={t('settings.hapticFeedback')}
              left={props => <List.Icon {...props} icon={() => <Vibrate size={24} color={theme.colors.primary} />} />}
              right={() => <Switch value={settings.haptics} onValueChange={(val) => updateSettings({ haptics: val })} />}
            />
            <Divider />

            {/* 5. Storage */}
            <List.Accordion
              title={t('settings.storageAndData')}
              left={props => <List.Icon {...props} icon={() => <HardDrive size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.localLogging')}
                right={() => <Switch value={settings.storage.localLogging} onValueChange={(val) => updateSettings({ storage: { ...settings.storage, localLogging: val } })} />}
              />
              <List.Item
                title={t('settings.exportData')}
                left={props => <List.Icon {...props} icon={() => <Download size={20} color={theme.colors.primary} />} />}
                onPress={() => Alert.alert("Export", "Data exported to CSV")}
              />
              <List.Item
                title={t('settings.deleteAllData')}
                titleStyle={{ color: 'red' }}
                left={props => <List.Icon {...props} icon={() => <Database size={20} color="red" />} />}
                onPress={confirmClearHistory}
              />
            </List.Accordion>
            <Divider />

            {/* 5b. Permissions */}
            <List.Accordion
              title={t('settings.permissions')}
              left={props => <List.Icon {...props} icon={() => <Shield size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.cameraAccess')}
                description={settings.permissions.camera ? t('settings.granted') : t('settings.denied')}
                right={() => <Switch value={settings.permissions.camera} onValueChange={(val) => {
                  updateSettings({ permissions: { ...settings.permissions, camera: val } });
                  if (val) Linking.openSettings();
                }} />}
              />
              <List.Item
                title={t('settings.microphoneAccess')}
                description={settings.permissions.microphone ? t('settings.granted') : t('settings.denied')}
                right={() => <Switch value={settings.permissions.microphone} onValueChange={(val) => {
                  updateSettings({ permissions: { ...settings.permissions, microphone: val } });
                  if (val) Linking.openSettings();
                }} />}
              />
              <List.Item
                title={t('settings.storageAccess')}
                description={settings.permissions.storage ? t('settings.appCanSave') : t('settings.mediaSavingDisabled')}
                right={() => <Switch value={settings.permissions.storage} onValueChange={(val) => {
                  updateSettings({ permissions: { ...settings.permissions, storage: val } });
                }} />}
              />
              <Divider style={{ marginVertical: 8 }} />
              <List.Subheader>{t('settings.cacheManagement')}</List.Subheader>
              <List.Item
                title={t('settings.mediaCacheSize')}
                description={cacheSize || t('settings.calculating')}
                left={props => <List.Icon {...props} icon={() => <Database size={20} color={theme.colors.tertiary} />} />}
                onPress={calculateCacheSize}
              />
              <List.Item
                title={isClearing ? t('settings.clearing') : t('settings.clearMediaCache')}
                titleStyle={{ color: theme.colors.error }}
                left={props => <List.Icon {...props} icon={() => <Trash2 size={20} color={theme.colors.error} />} />}
                onPress={handleClearCache}
                disabled={isClearing}
              />
            </List.Accordion>
            <Divider />

            {/* 6. Model */}
            <List.Accordion
              title={t('settings.modelPack')}
              left={props => <List.Icon {...props} icon={() => <Cpu size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.viewLibrary')}
                left={props => <List.Icon {...props} icon="library" />}
                onPress={() => navigation.navigate(ROUTES.MODEL_MANAGER)}
              />
              <List.Item
                title={isImporting ? t('settings.importing') : t('settings.importCustomPack')}
                left={props => <List.Icon {...props} icon={isImporting ? "loading" : "file-import"} />}
                onPress={handleImport}
                disabled={isImporting}
              />
            </List.Accordion>
            <Divider />

            {/* 7. System & Alerts */}
            <List.Accordion
              title={t('settings.systemAndAlerts')}
              left={props => <List.Icon {...props} icon={() => <Bell size={24} color={theme.colors.primary} />} />}
            >
              <List.Item
                title={t('settings.dailyReminders')}
                right={() => <Switch value={settings.systemAlerts.dailyReminders} onValueChange={(val) => updateSettings({ systemAlerts: { ...settings.systemAlerts, dailyReminders: val } })} />}
              />
              <List.Item
                title={t('settings.batterySaverMode')}
                right={() => <Switch value={settings.systemAlerts.powerManagement} onValueChange={(val) => updateSettings({ systemAlerts: { ...settings.systemAlerts, powerManagement: val } })} />}
              />
            </List.Accordion>
            <Divider />

            {/* 8. Developer Debug Mode */}
            <List.Item
              title={t('settings.developerDebugMode')}
              left={props => <List.Icon {...props} icon={() => <Bug size={24} color={theme.colors.primary} />} />}
              right={() => <Switch value={settings.developerDebugMode} onValueChange={(val) => updateSettings({ developerDebugMode: val })} />}
            />

          </List.Section>
        </Card>

        <View style={styles.dangerZone}>
          <Text variant="titleSmall" style={[styles.dangerTitle, { color: theme.colors.error }]}>{t('settings.dangerZone')}</Text>
          <Card mode="outlined" style={[styles.dangerCard, { borderColor: theme.colors.error }]}>
            <List.Item
              title={t('settings.resetAllFactorySettings')}
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
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
