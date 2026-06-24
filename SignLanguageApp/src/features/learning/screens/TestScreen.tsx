import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, IconButton, Snackbar, ActivityIndicator } from 'react-native-paper';
import { CheckCircle } from 'lucide-react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useTestLogic } from '../hooks/useTestLogic';
import { useTranslation } from 'react-i18next';

export default function TestScreen({ route, navigation }: any) {
  const { packId, duration, mode } = route.params || {};
  const theme = useTheme();
  const { t } = useTranslation();
  
  const cameraRef = React.useRef<any>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const {
    words,
    timeLeft,
    score,
    currentWord,
    testActive,
    facing,
    setFacing,
    isProcessing,
    snackbarMsg,
    setSnackbarMsg,
    snackbarColor,
    isModelReady,
    handleSimulateSkip,
    checkFromCamera
  } = useTestLogic(packId, duration, mode, cameraRef);
  const device = useCameraDevice(facing);



  if (!testActive) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="displaySmall" style={styles.scoreText}>{t('learning.testFinished')}</Text>
        <Text variant="headlineMedium">{t('learning.yourScore')}: {score}</Text>
        <Text variant="bodyMedium" style={{ marginTop: 8 }}>
          Mode: {t(`learning.${mode || 'random'}`)} | Duration: {duration || 60}s
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 32 }}>
          {t('learning.backToSetup')}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: timeLeft <= 10 ? 'red' : theme.colors.onBackground }}>
          {t('learning.time', { time: timeLeft })}
        </Text>
        <Text variant="headlineMedium">{t('learning.score', { score })}</Text>
      </View>

      <View style={styles.wordContainer}>
        <Text variant="displayLarge">{currentWord?.word}</Text>
        <Text variant="bodyLarge">{t('learning.signToTest', { word: currentWord?.word })}</Text>
      </View>

      <View style={styles.cameraPlaceholder}>
        {device != null ? (
          <View style={{ flex: 1, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
            <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} />
            <View style={styles.overlay}>
              <View style={styles.boundingBox} />
              <Text style={styles.overlayText}>{t('learning.alignSignHere') || 'Align sign here'}</Text>
            </View>
            <IconButton 
              icon="camera-flip" 
              iconColor="white"
              size={24}
              style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.2)' }}
              onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}
            />
          </View>
        ) : (
          <Text variant="bodyLarge" style={{ color: 'white' }}>Loading Camera...</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button 
          mode="outlined" 
          onPress={handleSimulateSkip} 
          style={styles.actionButton}
          disabled={isProcessing}
        >
          {t('learning.skip')}
        </Button>
        <Button 
          mode="contained" 
          onPress={checkFromCamera} 
          style={styles.actionButton} 
          buttonColor={theme.colors.primary}
          disabled={isProcessing || !isModelReady}
          icon={() => isProcessing ? <ActivityIndicator size={20} color="white" /> : <CheckCircle size={20} color="white" />}
        >
          {t('learning.check')}
        </Button>
      </View>

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={2000}
        style={{ backgroundColor: snackbarColor === "green" ? "#4CAF50" : "#F44336" }}
        action={{
          label: 'OK',
          textColor: 'white',
          onPress: () => setSnackbarMsg(""),
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{snackbarMsg}</Text>
      </Snackbar>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  wordContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    margin: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 8,
  },
  scoreText: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  boundingBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.6)',
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  overlayText: {
    color: 'rgba(0, 255, 0, 0.8)',
    marginTop: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden'
  }
});
