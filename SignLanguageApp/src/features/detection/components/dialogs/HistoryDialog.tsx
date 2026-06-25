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
  detectionMode?: 'live' | 'picture' | 'video';
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
    <Dialog visible={isVisible} onDismiss={onDismiss} style={{ maxHeight: '80%' }}>
      <Dialog.Title>
        {detectionMode !== 'live' 
          ? "Xác nhận kết quả"
          : isSelectingSession 
            ? "Chọn phiên để lưu" 
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
                        Toàn bộ kết quả phân tích video:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
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
                    </View>
                  )}
                </View>
              ) : (
                 <Text style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>Chưa có kết quả.</Text>
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
                Tạo phiên mới
              </Button>
              <Text variant="labelMedium" style={{ marginTop: 12, opacity: 0.7 }}>Hoặc lưu vào phiên cũ:</Text>
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
                <Text style={{ fontStyle: 'italic', opacity: 0.5 }}>Không có phiên cũ nào.</Text>
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
