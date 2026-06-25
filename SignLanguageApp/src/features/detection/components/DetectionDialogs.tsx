import React, { useEffect } from 'react';
import { StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Snackbar } from 'react-native-paper';

import UrlInputDialog from './dialogs/UrlInputDialog';
import HistoryDialog from './dialogs/HistoryDialog';
import PendingQueueDialog from './dialogs/PendingQueueDialog';
import ConfirmImageDialog from './dialogs/ConfirmImageDialog';
import BatchResultDialog from './dialogs/BatchResultDialog';

interface DetectionDialogsProps {
  theme: any;
  isHistoryDialogOpen: boolean;
  setIsHistoryDialogOpen: (open: boolean) => void;
  history: any[];
  onSaveSession?: (editedText: string, sessionId?: string | null) => void;
  onSaveMediaSession?: () => void;
  setSessionHistory?: (history: any[]) => void;
  detectionMode?: 'live' | 'picture' | 'video' | 'batch';
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
  selectedMedia?: string | null;
  isConfirmImageDialogOpen?: boolean;
  setIsConfirmImageDialogOpen?: (open: boolean) => void;
  confirmImageAnalysis?: () => void;
  imageToAnalyze?: string | null;
  imageToAnalyzeSize?: { width: number; height: number; bytes: number };
  activePackName?: string;
  modelInputShape?: number[];
  batchResults?: { fileName: string; sign: string; conf: number }[];
  isBatchResultDialogOpen?: boolean;
  setIsBatchResultDialogOpen?: (open: boolean) => void;
}

export default function DetectionDialogs({
  theme,
  isHistoryDialogOpen,
  setIsHistoryDialogOpen,
  history,
  onSaveSession,
  onSaveMediaSession,
  setSessionHistory,
  detectionMode,
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
  clearQueue,
  selectedMedia,
  isConfirmImageDialogOpen,
  setIsConfirmImageDialogOpen,
  confirmImageAnalysis,
  imageToAnalyze,
  imageToAnalyzeSize,
  activePackName,
  modelInputShape,
  batchResults,
  isBatchResultDialogOpen,
  setIsBatchResultDialogOpen
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
      if (isConfirmImageDialogOpen && setIsConfirmImageDialogOpen) {
        setIsConfirmImageDialogOpen(false);
        return true;
      }
      return false; // OS handles app exit
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isUrlDialogOpen, isHistoryDialogOpen, isDebugDialogOpen, isConfirmImageDialogOpen]);

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

          {isConfirmImageDialogOpen && setIsConfirmImageDialogOpen && confirmImageAnalysis && imageToAnalyzeSize && (
            <ConfirmImageDialog
              theme={theme}
              isVisible={isConfirmImageDialogOpen}
              onDismiss={() => setIsConfirmImageDialogOpen(false)}
              onConfirm={confirmImageAnalysis}
              imageUri={imageToAnalyze || null}
              imageSize={imageToAnalyzeSize}
              activePackName={activePackName || ''}
              modelInputShape={modelInputShape || []}
            />
          )}
          
          <HistoryDialog 
            theme={theme}
            isVisible={isHistoryDialogOpen}
            onDismiss={() => setIsHistoryDialogOpen(false)}
            history={history}
            onSaveSession={onSaveSession}
            onSaveMediaSession={onSaveMediaSession}
            setSessionHistory={setSessionHistory}
            detectionMode={detectionMode}
            selectedMedia={selectedMedia}
          />
          
          <PendingQueueDialog 
            theme={theme}
            isVisible={isDebugDialogOpen}
            onDismiss={() => setIsDebugDialogOpen(false)}
            debugData={debugData}
            clearQueue={clearQueue}
          />

          <BatchResultDialog
            theme={theme}
            isVisible={isBatchResultDialogOpen || false}
            onDismiss={() => setIsBatchResultDialogOpen?.(false)}
            results={batchResults || []}
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
