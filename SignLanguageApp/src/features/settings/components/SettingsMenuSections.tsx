import * as React from 'react';
import { Alert, Linking } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { Check, Sun, Volume2, Camera, Vibrate, HardDrive, Bell, Bug, Database, Download, Cpu, Shield, Trash2, Globe } from 'lucide-react-native';
import { ROUTES } from '../../../constants/routes';

interface SettingsMenuSectionsProps {
  theme: any;
  t: any;
  settings: any;
  updateSettings: any;
  navigation: any;
  cacheSize: string | null;
  isClearing: boolean;
  isImporting: boolean;
  calculateCacheSize: () => void;
  handleClearCache: () => void;
  handleImport: () => void;
  confirmClearHistory: () => void;
}

export default function SettingsMenuSections({
  theme,
  t,
  settings,
  updateSettings,
  navigation,
  cacheSize,
  isClearing,
  isImporting,
  calculateCacheSize,
  handleClearCache,
  handleImport,
  confirmClearHistory
}: SettingsMenuSectionsProps) {
  return (
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
  );
}
