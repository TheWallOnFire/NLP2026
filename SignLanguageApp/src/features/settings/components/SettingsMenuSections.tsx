import * as React from 'react';
import { Alert, Linking } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { Check, Sun, Volume2, Camera, Vibrate, HardDrive, Bell, Bug, Database, Download, Cpu, Shield, Trash2, Globe } from 'lucide-react-native';
import { ROUTES } from '../../../constants/routes';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '../store/useSettingsStore';

const SettingSlider = React.memo(({ label, value, min, max, step, color, theme, onSave }: any) => {
  const [localVal, setLocalVal] = React.useState(value);
  React.useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <View style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
      <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, fontSize: 14, fontWeight: 'bold' }}>
        {label}
      </Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={localVal}
        onValueChange={setLocalVal}
        onSlidingComplete={onSave}
        minimumTrackTintColor={color}
        maximumTrackTintColor={theme.colors.surfaceVariant}
        thumbTintColor={color}
      />
    </View>
  );
});

export default function SettingsMenuSections({
  theme,
  t,
  navigation,
  cacheSize,
  isClearing,
  isImporting,
  calculateCacheSize,
  handleClearCache,
  handleImport,
  confirmClearHistory
}: any) {
  // Pull sliced states to prevent massive re-renders across all sections!
  const language = useSettingsStore(state => state.language);
  const themeState = useSettingsStore(state => state.theme);
  const sound = useSettingsStore(state => state.sound);
  const camera = useSettingsStore(state => state.camera);
  const detection = useSettingsStore(state => state.detection);
  const haptics = useSettingsStore(state => state.haptics);
  const storage = useSettingsStore(state => state.storage);
  const permissions = useSettingsStore(state => state.permissions);
  const systemAlerts = useSettingsStore(state => state.systemAlerts);
  const developerDebugMode = useSettingsStore(state => state.developerDebugMode);
  const updateSettings = useSettingsStore(state => state.updateSettings);

  return (
    <List.Section>
      {/* Language */}
      <List.Accordion
        title={t('settings.language')}
        description={language === 'vi' ? t('settings.vietnamese') : t('settings.english')}
        left={props => <List.Icon {...props} icon={() => <Globe size={24} color={theme.colors.primary} />} />}
      >
        <List.Item
          title={t('settings.english')}
          onPress={() => updateSettings({ language: 'en' })}
          right={props => language === 'en' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
        <List.Item
          title={t('settings.vietnamese')}
          onPress={() => updateSettings({ language: 'vi' })}
          right={props => language === 'vi' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
      </List.Accordion>
      <Divider />

      {/* 1. Theme */}
      <List.Accordion
        title={t('settings.theme')}
        description={`${t('settings.current')}: ${t(`settings.${themeState}`)}`}
        left={props => <List.Icon {...props} icon={() => <Sun size={24} color={theme.colors.primary} />} />}
      >
        <List.Item
          title={t('settings.light')}
          onPress={() => updateSettings({ theme: 'light' })}
          right={props => themeState === 'light' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
        <List.Item
          title={t('settings.dark')}
          onPress={() => updateSettings({ theme: 'dark' })}
          right={props => themeState === 'dark' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
        <List.Item
          title={t('settings.mixed')}
          onPress={() => updateSettings({ theme: 'mixed' })}
          right={props => themeState === 'mixed' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
      </List.Accordion>
      <Divider />

      {/* 2. Sound & Voice (Dạng Bar - Tối ưu) */}
      <List.Accordion
        title={t('settings.soundAndVoice')}
        left={props => <List.Icon {...props} icon={() => <Volume2 size={24} color={theme.colors.primary} />} />}
      >
        <List.Item
          title={t('settings.systemSounds')}
          right={() => <Switch value={sound.systemSounds} onValueChange={(val) => updateSettings({ sound: { ...sound, systemSounds: val } })} />}
        />
        
        <SettingSlider 
          label={`Volume (${(sound.volume * 100).toFixed(0)}%)`}
          value={sound.volume} min={0} max={1} step={0.05}
          color={theme.colors.primary} theme={theme}
          onSave={(val: number) => updateSettings({ sound: { ...sound, volume: val } })}
        />

        <SettingSlider 
          label={`Voice Speech Rate (${sound.voiceRate.toFixed(1)}x)`}
          value={sound.voiceRate} min={0.5} max={2.0} step={0.1}
          color={theme.colors.secondary} theme={theme}
          onSave={(val: number) => updateSettings({ sound: { ...sound, voiceRate: val } })}
        />
      </List.Accordion>
      <Divider />

      {/* 3. Camera & Detection */}
      <List.Accordion
        title={t('settings.cameraAndDetection')}
        description={`${camera?.defaultFacing === 'front' ? t('settings.frontCamera') : t('settings.backCamera')} • ${detection?.speed.toUpperCase()}`}
        left={props => <List.Icon {...props} icon={() => <Camera size={24} color={theme.colors.primary} />} />}
      >
        <List.Item
          title={t('settings.frontCamera')}
          onPress={() => updateSettings({ camera: { ...camera, defaultFacing: 'front' } })}
          right={props => camera?.defaultFacing === 'front' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
        <List.Item
          title={t('settings.backCamera')}
          onPress={() => updateSettings({ camera: { ...camera, defaultFacing: 'back' } })}
          right={props => camera?.defaultFacing === 'back' ? <Check size={20} color={theme.colors.primary} /> : null}
        />
        <Divider style={{ marginVertical: 8 }} />
        <List.Subheader>{t('settings.detectionSpeed')}</List.Subheader>
        {(['slow', 'normal', 'fast', 'off'] as const).map(speed => (
          <List.Item
            key={speed}
            title={speed.toUpperCase()}
            onPress={() => updateSettings({ detection: { ...detection, speed } })}
            right={props => detection?.speed === speed ? <Check size={20} color={theme.colors.primary} /> : null}
          />
        ))}
      </List.Accordion>
      <Divider />

      {/* 4. Haptics */}
      <List.Item
        title={t('settings.hapticFeedback')}
        left={props => <List.Icon {...props} icon={() => <Vibrate size={24} color={theme.colors.primary} />} />}
        right={() => <Switch value={haptics} onValueChange={(val) => updateSettings({ haptics: val })} />}
      />
      <Divider />

      {/* 5. Storage */}
      <List.Accordion
        title={t('settings.storageAndData')}
        left={props => <List.Icon {...props} icon={() => <HardDrive size={24} color={theme.colors.primary} />} />}
      >
        <List.Item
          title={t('settings.localLogging')}
          right={() => <Switch value={storage.localLogging} onValueChange={(val) => updateSettings({ storage: { ...storage, localLogging: val } })} />}
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
          description={permissions.camera ? t('settings.granted') : t('settings.denied')}
          right={() => <Switch value={permissions.camera} onValueChange={(val) => {
            updateSettings({ permissions: { ...permissions, camera: val } });
            if (val) Linking.openSettings();
          }} />}
        />
        <List.Item
          title={t('settings.microphoneAccess')}
          description={permissions.microphone ? t('settings.granted') : t('settings.denied')}
          right={() => <Switch value={permissions.microphone} onValueChange={(val) => {
            updateSettings({ permissions: { ...permissions, microphone: val } });
            if (val) Linking.openSettings();
          }} />}
        />
        <List.Item
          title={t('settings.storageAccess')}
          description={permissions.storage ? t('settings.appCanSave') : t('settings.mediaSavingDisabled')}
          right={() => <Switch value={permissions.storage} onValueChange={(val) => {
            updateSettings({ permissions: { ...permissions, storage: val } });
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
          right={() => <Switch value={systemAlerts.dailyReminders} onValueChange={(val) => updateSettings({ systemAlerts: { ...systemAlerts, dailyReminders: val } })} />}
        />
        <List.Item
          title={t('settings.batterySaverMode')}
          right={() => <Switch value={systemAlerts.powerManagement} onValueChange={(val) => updateSettings({ systemAlerts: { ...systemAlerts, powerManagement: val } })} />}
        />
      </List.Accordion>
      <Divider />

      {/* 8. Developer Debug Mode */}
      <List.Item
        title={t('settings.developerDebugMode')}
        left={props => <List.Icon {...props} icon={() => <Bug size={24} color={theme.colors.primary} />} />}
        right={() => <Switch value={developerDebugMode} onValueChange={(val) => updateSettings({ developerDebugMode: val })} />}
      />

    </List.Section>
  );
}
