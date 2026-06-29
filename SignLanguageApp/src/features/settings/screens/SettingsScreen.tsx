import * as React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, List, useTheme, Card, Divider, Portal, Dialog, Button, Paragraph } from 'react-native-paper';
import { AlertTriangle as AlertTriangleIcon, Settings as SettingsIconLucide } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useSettingsLogic } from '../hooks/useSettingsLogic';
import SettingsMenuSections from '../components/SettingsMenuSections';
import { ROUTES } from '../../../constants/routes';

export default function SettingsScreen({ navigation }: any) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isAboutVisible, setIsAboutVisible] = React.useState(false);

  const {
    settings,
    cacheSize,
    isClearing,
    isImporting,
    calculateCacheSize,
    handleClearCache,
    handleImport,
    confirmClearHistory,
    handleClearAllData
  } = useSettingsLogic();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SettingsIconLucide color="white" size={32} />
        <Text variant="headlineMedium" style={styles.headerTitle}>{t('settings.title')}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Card mode="elevated" style={styles.menuCard}>
          <SettingsMenuSections 
            theme={theme}
            t={t}
            navigation={navigation}
            cacheSize={cacheSize}
            isClearing={isClearing}
            isImporting={isImporting}
            calculateCacheSize={calculateCacheSize}
            handleClearCache={handleClearCache}
            handleImport={handleImport}
            confirmClearHistory={confirmClearHistory}
          />
        </Card>

        <View style={styles.dangerZone}>
          <Text variant="titleSmall" style={[styles.dangerTitle, { color: theme.colors.error }]}>{t('settings.dangerZone')}</Text>
          <Card mode="outlined" style={[styles.dangerCard, { borderColor: theme.colors.error }]}>
            <List.Item
              title={t('settings.resetAllFactorySettings')}
              titleStyle={{ color: theme.colors.error, fontWeight: 'bold' }}
              description={t('settings.wipeAllDataDesc')}
              left={props => <List.Icon {...props} icon={() => <AlertTriangleIcon size={24} color={theme.colors.error} />} />}
              onPress={handleClearAllData}
            />
          </Card>
        </View>

        <List.Section>
          <List.Subheader>{t('settings.developerDebug')}</List.Subheader>
          <List.Item
            title={t('settings.mlDiagnosticTool')}
            description={t('settings.mlDiagnosticDesc')}
            left={props => <List.Icon {...props} icon="bug" />}
            onPress={() => navigation.navigate(ROUTES.ML_DIAGNOSTIC)}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>{t('settings.aboutApp')}</List.Subheader>
          <List.Item
            title={t('settings.additionalInfo')}
            description={t('settings.aboutDesc')}
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => setIsAboutVisible(true)}
          />
          <List.Item
            title="GitHub Repository"
            description={t('settings.githubSource')}
            left={props => <List.Icon {...props} icon="github" />}
            onPress={async () => {
              const url = 'https://github.com';
              try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                }
              } catch (e) {
                console.warn("Cannot open URL", e);
              }
            }}
          />
        </List.Section>
        
        <Divider style={styles.divider} />

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.versionText}>{t('settings.version')}</Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={isAboutVisible} onDismiss={() => setIsAboutVisible(false)} style={{ backgroundColor: theme.colors.elevation.level3 }}>
          <Dialog.Title>{t('settings.additionalInfo')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>SignLanguageApp v1.0.0</Paragraph>
            <Paragraph style={{ marginBottom: 16 }}>{t('settings.aboutDesc')}</Paragraph>
            <Paragraph style={{ opacity: 0.7 }}>
              This application utilizes an autonomous Agentic AI pipeline for real-time sign language recognition, running completely on-device without blocking the main UI thread.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsAboutVisible(false)}>{t('detection.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  divider: {
    marginVertical: 16,
  },
});
