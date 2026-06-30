import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

interface BatchResultDialogProps {
  theme: any;
  isVisible: boolean;
  onDismiss: () => void;
  results: { fileName: string; sign: string; conf: number }[];
}

export default function BatchResultDialog({ theme, isVisible, onDismiss, results }: BatchResultDialogProps) {
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal visible={isVisible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.elevation.level3 }]}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>{t('detection.batchZipResults')}</Text>
        </View>
        <Divider />
        <ScrollView style={styles.scrollArea}>
          {results.length === 0 ? (
            <Text style={styles.emptyText}>{t('detection.noData')}</Text>
          ) : (
            results.map((item, index) => {
              const isHighConf = item.conf >= 0.4;
              return (
                <View key={index} style={[styles.row, { borderBottomColor: theme.colors.surfaceVariant }]}>
                  <View style={styles.colName}>
                    <Text variant="bodyMedium" numberOfLines={1}>{item.fileName}</Text>
                  </View>
                  <View style={styles.colResult}>
                    <Text variant="bodyLarge" style={{ fontWeight: 'bold', color: isHighConf ? theme.colors.primary : theme.colors.error }}>
                      {item.sign}
                    </Text>
                  </View>
                  <View style={styles.colConf}>
                    {isHighConf ? <CheckCircle2 color={theme.colors.primary} size={16} /> : <AlertCircle color={theme.colors.error} size={16} />}
                    <Text variant="bodySmall" style={{ marginLeft: 4 }}>{Math.round(item.conf * 100)}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
        <Divider />
        <View style={styles.footer}>
          <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant}}>{t('detection.totalImages', { count: results.length })}</Text>
          <Button mode="contained" onPress={onDismiss}>{t('detection.closeBtn')}</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 28,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  colName: {
    flex: 2,
    paddingRight: 8,
  },
  colResult: {
    flex: 1,
    alignItems: 'center',
  },
  colConf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
});
