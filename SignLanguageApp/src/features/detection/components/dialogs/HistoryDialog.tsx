import React, { useEffect, useState } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { Dialog, TextInput, Button, Badge, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useHistoryStore } from '../../../history/store/useHistoryStore';

interface HistoryDialogProps {
  theme: any;
  isVisible: boolean;
  onDismiss: () => void;
  history: any[];
  onSaveSession?: (editedText: string, sessionId?: string | null) => void;
  onSaveMediaSession?: () => void;
  setSessionHistory?: (history: any[]) => void;
  detectionMode?: 'live' | 'picture' | 'video' | 'batch' | 'auto';
  selectedMedia?: string | null;
}

export default function HistoryDialog({
  theme,
  isVisible,
  onDismiss,
  history,
  onSaveSession,
  onSaveMediaSession,
  setSessionHistory,
  detectionMode = 'live',
  selectedMedia
}: HistoryDialogProps) {
  const { t } = useTranslation();
  const [isExportingText, setIsExportingText] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSelectingSession, setIsSelectingSession] = useState(false);
  const { history: globalHistory } = useHistoryStore();

  useEffect(() => {
    if (isVisible) {
      setIsExportingText(false);
      setIsSelectingSession(false);
      setEditedText('');
    }
  }, [isVisible]);

  return (
    <Dialog visible={isVisible} onDismiss={onDismiss} style={{ maxHeight: '80%', borderRadius: 28, backgroundColor: theme.colors.elevation.level3 }}>
      <Dialog.Title>
        {detectionMode !== 'live' 
          ? t('detection.confirmResults')
          : isSelectingSession 
            ? t('detection.selectSessionToSave') 
            : t('detection.detectionResults')}
      </Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          {detectionMode !== 'live' ? (
            <View style={{ paddingVertical: 8 }}>
              {history.length > 0 ? (
                <View style={{ alignItems: 'center' }}>
                  {detectionMode === 'picture' && selectedMedia && (
                    <View style={{ width: 200, height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: '#333' }}>
                      <Image source={{ uri: selectedMedia }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  )}
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center', marginBottom: 16 }}>
                    {history[0].sign}
                  </Text>
                  
                  {detectionMode === 'video' && history.length > 1 && (
                    <View style={{ width: '100%' }}>
                      <Text variant="labelMedium" style={{ opacity: 0.7, marginBottom: 12, textAlign: 'center' }}>
                        {t('detection.allVideoResults')}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                        {[...history].reverse().map((item, i) => {
                          const conf = item.conf || 0;
                          let bgColor = '#FFEBEE';
                          let textColor = '#C62828';
                          if (conf > 0.9) { bgColor = '#E8F5E9'; textColor = '#2E7D32'; }
                          else if (conf > 0.6) { bgColor = '#FFF3E0'; textColor = '#E65100'; }

                          return (
                            <View
                              key={item.id || i}
                              style={{
                                backgroundColor: bgColor,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: textColor + '30',
                                shadowColor: textColor,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                              }}
                            >
                              <Text style={{ color: textColor, fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 }}>
                                {item.sign}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                 <Text style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>{t('detection.noResultsYet')}</Text>
              )}
            </View>
          ) : isSelectingSession ? (
            <View style={{ gap: 8 }}>
              <Button 
                mode="contained" 
                onPress={() => {
                  if (onSaveSession && setSessionHistory) {
                    onSaveSession(editedText, null); // Create new
                    setSessionHistory([]);
                  }
                  onDismiss();
                }}
              >
                {t('detection.createNewSession')}
              </Button>
              <Text variant="labelMedium" style={{ marginTop: 12, opacity: 0.7 }}>{t('detection.orSaveToOldSession')}</Text>
              {globalHistory.filter(h => h.mode === 'live' && h.type === 'detection').map((item) => (
                <Button 
                  key={item.id} 
                  mode="outlined" 
                  onPress={() => {
                    if (onSaveSession && setSessionHistory) {
                      onSaveSession(editedText, item.id);
                      setSessionHistory([]);
                    }
                    onDismiss();
                  }}
                  style={{ justifyContent: 'flex-start' }}
                  contentStyle={{ justifyContent: 'flex-start' }}
                >
                  {item.date} {item.time} ({item.signs?.length || 0} từ)
                </Button>
              ))}
              {globalHistory.filter(h => h.mode === 'live' && h.type === 'detection').length === 0 && (
                <Text style={{ fontStyle: 'italic', opacity: 0.5 }}>{t('detection.noOldSessions')}</Text>
              )}
            </View>
          ) : isExportingText ? (
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
                {[...history].reverse().map((item, i) => {
                  const conf = item.conf || 0;
                  let bgColor = '#FFEBEE';
                  let textColor = '#C62828';
                  if (conf > 0.9) { bgColor = '#E8F5E9'; textColor = '#2E7D32'; }
                  else if (conf > 0.6) { bgColor = '#FFF3E0'; textColor = '#E65100'; }

                  return (
                    <View
                      key={item.id || i}
                      style={{
                        backgroundColor: bgColor,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: textColor + '30',
                        shadowColor: textColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 }}>
                        {item.sign}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>{t('detection.noWordsRecorded')}</Text>
            )
          )}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        {detectionMode !== 'live' && (
          <Button onPress={onDismiss}>{t('detection.cancel')}</Button>
        )}
        {detectionMode !== 'live' && (
          <Button mode="contained" disabled={history.length === 0} onPress={() => {
            if (onSaveMediaSession) {
              onSaveMediaSession();
            }
            onDismiss();
          }}>
            {t('detection.confirm')}
          </Button>
        )}
        
        {detectionMode === 'live' && isSelectingSession && (
          <Button onPress={() => setIsSelectingSession(false)}>{t('detection.cancel')}</Button>
        )}
        
        {!isSelectingSession && isExportingText && (
          <Button onPress={() => setIsExportingText(false)}>{t('detection.cancel')}</Button>
        )}
        {!isSelectingSession && isExportingText && (
          <Button mode="contained" onPress={() => setIsSelectingSession(true)}>
            {t('detection.confirm')}
          </Button>
        )}

        {!isSelectingSession && !isExportingText && detectionMode === 'live' && (
          <Button onPress={onDismiss}>{t('detection.close')}</Button>
        )}

        {!isSelectingSession && !isExportingText && detectionMode === 'live' && (
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
