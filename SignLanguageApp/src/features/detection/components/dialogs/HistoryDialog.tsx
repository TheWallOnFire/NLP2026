import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, TextInput, Button, Badge, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface HistoryDialogProps {
  theme: any;
  isVisible: boolean;
  onDismiss: () => void;
  history: any[];
  onSaveSession?: (editedText: string) => void;
  setSessionHistory?: (history: any[]) => void;
}

export default function HistoryDialog({
  theme,
  isVisible,
  onDismiss,
  history,
  onSaveSession,
  setSessionHistory
}: HistoryDialogProps) {
  const { t } = useTranslation();
  const [isExportingText, setIsExportingText] = useState(false);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (isVisible) {
      setIsExportingText(false);
      setEditedText('');
    }
  }, [isVisible]);

  return (
    <Dialog visible={isVisible} onDismiss={onDismiss} style={{ maxHeight: '80%' }}>
      <Dialog.Title>{t('detection.detectionResults')}</Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          {isExportingText ? (
            <TextInput
              label={t('detection.editText')}
              value={editedText}
              onChangeText={setEditedText}
              mode="outlined"
              multiline
              numberOfLines={4}
              autoFocus
              style={{ marginTop: 8 }}
            />
          ) : (
            history.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {history.map((item, i) => (
                  <Badge 
                    key={item.id || i} 
                    size={28} 
                    style={{ 
                      backgroundColor: theme.colors.elevation.level3, 
                      color: theme.colors.onSurface, 
                      paddingHorizontal: 12,
                      fontSize: 14 
                    }}
                  >
                    {item.sign}
                  </Badge>
                ))}
              </View>
            ) : (
              <Text style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>{t('detection.noWordsRecorded')}</Text>
            )
          )}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        {isExportingText && <Button onPress={() => setIsExportingText(false)}>{t('detection.cancel')}</Button>}
        {isExportingText && (
          <Button mode="contained" onPress={() => {
            if (onSaveSession && setSessionHistory) {
              onSaveSession(editedText);
              setSessionHistory([]);
            }
            onDismiss();
          }}>{t('detection.confirm')}</Button>
        )}
        
        {!isExportingText && <Button onPress={onDismiss}>{t('detection.close')}</Button>}
        {!isExportingText && (
          <Button 
            mode="contained" 
            disabled={history.length === 0}
            onPress={() => {
              const rawSigns = history.map(h => h.sign).reverse();
              let finalString = "";
              for (const sign of rawSigns) {
                const lowerSign = sign.toLowerCase();
                if (lowerSign === 'space' || lowerSign === '_' || lowerSign === 'dấu cách' || lowerSign === 'khoảng trắng' || lowerSign === ' ') {
                  finalString += ' ';
                } else {
                  finalString += sign;
                }
              }
              setEditedText(finalString);
              setIsExportingText(true);
            }}
          >
            {t('detection.exportText')}
          </Button>
        )}
      </Dialog.Actions>
    </Dialog>
  );
}
