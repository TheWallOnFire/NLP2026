import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Text, Button, useTheme, Appbar, Snackbar } from 'react-native-paper';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useLearningStore } from '../store/useLearningStore';
import { useModelStore } from '../store/useModelStore';
import DebugOverlay from '../../detection/components/DebugOverlay';
import ConfirmImageDialog from '../../detection/components/dialogs/ConfirmImageDialog';
import { usePracticeLogic } from '../hooks/usePracticeLogic';
import { useTranslation } from 'react-i18next';

import PracticeHeader from '../components/PracticeHeader';
import PracticeCameraPreview from '../components/PracticeCameraPreview';
import PracticeControls from '../components/PracticeControls';

export default function PracticeScreen({ route, navigation }: any) {
  const { packId, wordId } = route.params || {};
  const theme = useTheme();
  const { t } = useTranslation();
  
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const packName = useModelStore(state => state.packs.find(p => p.id === packId)?.name);
  
  const cameraRef = useRef<any>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const {
    practiceWords,
    currentIndex,
    currentWord,
    facing,
    setFacing,
    isProcessing,
    snackbarMsg,
    setSnackbarMsg,
    snackbarColor,
    isDebugDialogOpen,
    setIsDebugDialogOpen,
    debugData,
    setDebugData,
    isModelReady,
    getDebugInfo,
    handleSkip,
    checkFromCamera,
    pickImageForDetection,
    isConfirmImageDialogOpen,
    setIsConfirmImageDialogOpen,
    imageToAnalyze,
    imageToAnalyzeSize,
    confirmImageAnalysis,
    modelShape
  } = usePracticeLogic(packId, wordId, cameraRef);
  
  const device = useCameraDevice(facing);

  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => setIsAppActive(next === 'active'));
    return () => subscription.remove();
  }, []);
  const isCameraActive = isFocused && isAppActive;

  if (!currentWord) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium">{t('learning.noWordsToPractice')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          {t('learning.goBack')}
        </Button>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>{t('learning.cameraPermissionNeeded')}</Text>
        <Button mode="contained" onPress={async () => await requestPermission()}>{t('learning.grantPermission')}</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('learning.practiceTitle', { word: currentWord.word })} />
        <Appbar.Action icon="bug" onPress={() => { setDebugData(getDebugInfo()); setIsDebugDialogOpen(true); }} />
      </Appbar.Header>

      <PracticeHeader 
        currentWord={currentWord}
        currentIndex={currentIndex}
        totalWords={practiceWords.length}
        packId={packId}
      />

      <PracticeCameraPreview 
        device={device}
        cameraRef={cameraRef}
        isCameraActive={isCameraActive}
        facing={facing}
        setFacing={setFacing}
      />

      <PracticeControls 
        isProcessing={isProcessing}
        isModelReady={isModelReady}
        pickImageForDetection={pickImageForDetection}
        checkFromCamera={checkFromCamera}
        handleSkip={handleSkip}
      />

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={1500}
        style={{ 
          marginBottom: 20, 
          backgroundColor: snackbarColor === "green" ? "#4CAF50" : snackbarColor === "red" ? "#F44336" : theme.colors.elevation.level3
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{snackbarMsg}</Text>
      </Snackbar>

      <DebugOverlay 
        debugData={debugData} 
        activePackWords={words.map(w => w.word)} 
      />

      {isConfirmImageDialogOpen && imageToAnalyzeSize && (
        <ConfirmImageDialog
          theme={theme}
          isVisible={isConfirmImageDialogOpen}
          onDismiss={() => setIsConfirmImageDialogOpen(false)}
          onConfirm={confirmImageAnalysis}
          imageUri={imageToAnalyze}
          imageSize={imageToAnalyzeSize}
          activePackName={packName || ''}
          modelInputShape={modelShape || []}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
