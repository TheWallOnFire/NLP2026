import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Dialog, Portal, Badge, Divider, ActivityIndicator, Snackbar, TextInput } from 'react-native-paper';

interface DetectionDialogsProps {
  theme: any;
  isHistoryDialogOpen: boolean;
  setIsHistoryDialogOpen: (open: boolean) => void;
  history: any[];
  isDebugDialogOpen: boolean;
  setIsDebugDialogOpen: (open: boolean) => void;
  debugData: any;
  snackbarMsg: string;
  setSnackbarMsg: (msg: string) => void;
  isUrlDialogOpen?: boolean;
  setIsUrlDialogOpen?: (open: boolean) => void;
  handleUrlImage?: (url: string) => void;
  urlInput?: string;
  setUrlInput?: (url: string) => void;
}

export default function DetectionDialogs({
  theme,
  isHistoryDialogOpen,
  setIsHistoryDialogOpen,
  history,
  isDebugDialogOpen,
  setIsDebugDialogOpen,
  debugData,
  snackbarMsg,
  setSnackbarMsg,
  isUrlDialogOpen,
  setIsUrlDialogOpen,
  handleUrlImage,
  urlInput,
  setUrlInput
}: DetectionDialogsProps) {
  useEffect(() => {
    const onBackPress = () => {
      if (isUrlDialogOpen) {
        setIsUrlDialogOpen?.(false);
        return true;
      }
      if (isHistoryDialogOpen) {
        setIsHistoryDialogOpen(false);
        return true;
      }
      if (isDebugDialogOpen) {
        setIsDebugDialogOpen(false);
        return true;
      }
      return false; // Cho phép OS xử lý (thoát app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isUrlDialogOpen, isHistoryDialogOpen, isDebugDialogOpen]);

  return (
    <>
      <Portal>
        <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* URL Input Dialog */}
          {setIsUrlDialogOpen && handleUrlImage && setUrlInput && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
              <Dialog visible={!!isUrlDialogOpen} onDismiss={() => setIsUrlDialogOpen(false)}>
              <Dialog.Title>Nhập Link Ảnh (URL)</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Đường dẫn ảnh (http://...)"
                value={urlInput || ''}
                onChangeText={setUrlInput}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.6 }}>
                Ảnh sẽ được tải về tạm thời để nhận diện.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsUrlDialogOpen(false)}>Hủy</Button>
              <Button mode="contained" onPress={() => {
                const urlPattern = /^https?:\/\/.+/i;
                if (!urlInput || !urlPattern.test(urlInput)) {
                  Alert.alert("Lỗi", "Vui lòng nhập một đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://");
                  return;
                }
                handleUrlImage(urlInput);
              }} disabled={!urlInput}>Tải & Quét</Button>
            </Dialog.Actions>
            </Dialog>
            </KeyboardAvoidingView>
          )}
        {/* History Dialog */}
        <Dialog visible={isHistoryDialogOpen} onDismiss={() => setIsHistoryDialogOpen(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>Detection History</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              {history.length > 0 ? (
                history.map((item, i) => (
                  <View key={item.id || i} style={styles.historyListItem}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.sign}</Text>
                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>{item.date} • {item.time}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No history recorded yet.</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsHistoryDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Pending Queue Dialog */}
        <Dialog visible={isDebugDialogOpen} onDismiss={() => setIsDebugDialogOpen(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>Hàng Đợi Xử Lý (Queue)</Dialog.Title>
          <Dialog.Content>
            {debugData ? (
              <ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Badge size={12} style={{ backgroundColor: debugData.isProcessing ? theme.colors.error : theme.colors.primary, marginRight: 8 }} />
                  <Text variant="titleMedium">Trạng thái: <Text style={{ fontWeight: 'bold' }}>{debugData.isProcessing ? 'ĐANG XỬ LÝ' : 'RẢNH RỖI'}</Text></Text>
                </View>

                {debugData.isProcessing && debugData.processingItem && (
                  <View style={{ padding: 12, backgroundColor: theme.colors.primaryContainer, borderRadius: 8, marginBottom: 16 }}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, marginBottom: 4 }}>► Đang tính toán:</Text>
                    <Text variant="bodySmall" style={{ fontFamily: 'monospace' }} numberOfLines={1}>
                      {debugData.processingItem.split('/').pop()}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text variant="labelLarge">Đang chờ (Pending):</Text>
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
                  <Text variant="bodyMedium" style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>Không có ảnh nào chờ.</Text>
                )}
              </ScrollView>
            ) : (
              <ActivityIndicator size="large" style={{ margin: 20 }} />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDebugDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
        </SafeAreaView>
      </Portal>

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={2000}
        style={{ marginBottom: 20 }}
      >
        {snackbarMsg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  historyListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
