import React, { useEffect } from 'react';
import { StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Snackbar } from 'react-native-paper';

import UrlInputDialog from './dialogs/UrlInputDialog';
import HistoryDialog from './dialogs/HistoryDialog';
import PendingQueueDialog from './dialogs/PendingQueueDialog';

interface DetectionDialogsProps {
  theme: any;
  isHistoryDialogOpen: boolean;
  setIsHistoryDialogOpen: (open: boolean) => void;
  history: any[];
  onSaveSession?: (editedText: string) => void;
  setSessionHistory?: (history: any[]) => void;
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
  clearQueue?: () => void;
}

export default function DetectionDialogs({
  theme,
  isHistoryDialogOpen,
  setIsHistoryDialogOpen,
  history,
  onSaveSession,
  setSessionHistory,
  isDebugDialogOpen,
  setIsDebugDialogOpen,
  debugData,
  snackbarMsg,
  setSnackbarMsg,
  isUrlDialogOpen,
  setIsUrlDialogOpen,
  handleUrlImage,
  urlInput,
  setUrlInput,
  clearQueue
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
      return false; // OS handles app exit
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isUrlDialogOpen, isHistoryDialogOpen, isDebugDialogOpen]);

  return (
    <>
      <Portal>
        <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {setIsUrlDialogOpen && handleUrlImage && setUrlInput && isUrlDialogOpen && (
            <UrlInputDialog 
              isVisible={!!isUrlDialogOpen}
              onDismiss={() => setIsUrlDialogOpen(false)}
              urlInput={urlInput || ''}
              setUrlInput={setUrlInput}
              onSubmit={handleUrlImage}
            />
          )}
          
          <HistoryDialog 
            theme={theme}
            isVisible={isHistoryDialogOpen}
            onDismiss={() => setIsHistoryDialogOpen(false)}
            history={history}
            onSaveSession={onSaveSession}
            setSessionHistory={setSessionHistory}
          />
          
          <PendingQueueDialog 
            theme={theme}
            isVisible={isDebugDialogOpen}
            onDismiss={() => setIsDebugDialogOpen(false)}
            debugData={debugData}
            clearQueue={clearQueue}
          />
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
