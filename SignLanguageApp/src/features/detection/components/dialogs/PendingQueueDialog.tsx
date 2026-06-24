import React from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, Badge, Text, Divider, ActivityIndicator, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface PendingQueueDialogProps {
  theme: any;
  isVisible: boolean;
  onDismiss: () => void;
  debugData: any;
  clearQueue?: () => void;
}

export default function PendingQueueDialog({
  theme,
  isVisible,
  onDismiss,
  debugData,
  clearQueue
}: PendingQueueDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog visible={isVisible} onDismiss={onDismiss} style={{ maxHeight: '80%' }}>
      <Dialog.Title>{t('detection.pendingQueue')}</Dialog.Title>
      <Dialog.Content>
        {debugData ? (
          <ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Badge size={12} style={{ backgroundColor: debugData.isProcessing ? theme.colors.error : theme.colors.primary, marginRight: 8 }} />
              <Text variant="titleMedium">{t('detection.status')}<Text style={{ fontWeight: 'bold' }}>{debugData.isProcessing ? t('detection.processing') : t('detection.idle')}</Text></Text>
            </View>

            {debugData.isProcessing && debugData.processingItem && (
              <View style={{ padding: 12, backgroundColor: theme.colors.primaryContainer, borderRadius: 8, marginBottom: 16 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, marginBottom: 4 }}>{t('detection.calculatingItem')}</Text>
                <Text variant="bodySmall" style={{ fontFamily: 'monospace' }} numberOfLines={1}>
                  {debugData.processingItem.split('/').pop()}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text variant="labelLarge">{t('detection.pendingItems')}</Text>
              <Text variant="labelMedium">{debugData.queueLength} / 10</Text>
            </View>
            
            <Divider style={{ marginBottom: 8 }} />

            {debugData.queue.length > 0 ? (
              debugData.queue.map((q: any, i: number) => (
                <View key={i} style={{ padding: 8, backgroundColor: theme.colors.surfaceVariant, marginBottom: 4, borderRadius: 8 }}>
                  <Text variant="bodySmall" style={{ fontFamily: 'monospace' }} numberOfLines={1}>
                    #{i+1} - {typeof q === 'string' ? q.split('/').pop() : q?.uri?.split('/').pop()}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>{t('detection.noItemsInQueue')}</Text>
            )}
          </ScrollView>
        ) : (
          <ActivityIndicator size="large" style={{ margin: 20 }} />
        )}
      </Dialog.Content>
      <Dialog.Actions>
        {clearQueue && <Button textColor={theme.colors.error} onPress={() => clearQueue()}>{t('detection.clearQueue')}</Button>}
        <Button onPress={onDismiss}>{t('detection.close')}</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
