import React from 'react';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Dialog, TextInput, Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface UrlInputDialogProps {
  isVisible: boolean;
  onDismiss: () => void;
  urlInput: string;
  setUrlInput: (url: string) => void;
  onSubmit: (url: string) => void;
}

export default function UrlInputDialog({
  isVisible,
  onDismiss,
  urlInput,
  setUrlInput,
  onSubmit
}: UrlInputDialogProps) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <>
      <Dialog visible={isVisible} onDismiss={onDismiss} style={{ borderRadius: 28 }}>
        <Dialog.Title>{t('detection.urlInputTitle')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label={t('detection.urlInputLabel')}
            value={urlInput}
            onChangeText={setUrlInput}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="url"
            maxLength={2048} // Fix Bug 48: Chống dán mã độc Base64 siêu to khổng lồ làm tràn RAM
          />
          <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.6 }}>
            {t('detection.urlInputDesc')}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('detection.cancel')}</Button>
          <Button mode="contained" onPress={() => {
            const urlPattern = /^https?:\/\/.+/i;
            if (!urlInput || !urlPattern.test(urlInput)) {
              Alert.alert(t('detection.error'), t('detection.invalidUrlError'));
              return;
            }
            onSubmit(urlInput);
          }} disabled={!urlInput}>{t('detection.downloadAndScan')}</Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}
