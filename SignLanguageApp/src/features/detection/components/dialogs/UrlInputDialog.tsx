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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
      <Dialog visible={isVisible} onDismiss={onDismiss}>
        <Dialog.Title>{t('detection.urlInputTitle')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label={t('detection.urlInputLabel')}
            value={urlInput}
            onChangeText={setUrlInput}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="url"
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
    </KeyboardAvoidingView>
  );
}
