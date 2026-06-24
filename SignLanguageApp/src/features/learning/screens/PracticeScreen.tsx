import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { CheckCircle, Camera as CameraIcon, SkipForward } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button, useTheme, Card, Appbar, IconButton, Snackbar, ActivityIndicator } from 'react-native-paper';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLearningStore } from '../store/useLearningStore';
import DebugOverlay from '../../detection/components/DebugOverlay';
import { usePracticeLogic } from '../hooks/usePracticeLogic';
import { useTranslation } from 'react-i18next';

export default function PracticeScreen({ route, navigation }: any) {
  const { packId, wordId } = route.params || {};
  const theme = useTheme();
  const { t } = useTranslation();
  
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const markLearned = useLearningStore(state => state.markLearned);
  
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
    pickImageForDetection
  } = usePracticeLogic(packId, wordId, cameraRef);
  const device = useCameraDevice(facing);

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

      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.wordTitle}>{currentWord.word}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{t('learning.wordCountOf', { current: currentIndex + 1, total: practiceWords.length })}</Text>
        </View>
      </View>

      <Card style={styles.card} mode="elevated">
        <Image 
          key={currentWord.id}
          source={{ uri: `${FileSystem.documentDirectory}packs/${packId}/word_images/${currentWord.word}.png` }} 
          style={{ width: '100%', height: 220 }}
          resizeMode="contain"
        />
      </Card>

      <View style={styles.cameraWrapper}>
        <LinearGradient 
          colors={['#ff9a9e', '#fecfef']} 
          style={StyleSheet.absoluteFill} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cameraContainer}>
          {device != null && (
            <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} />
          )}

          <View style={styles.boundingBoxContainer} pointerEvents="none">
            <View style={styles.boundingBox} />
          </View>
          
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.cameraTopOverlay}
          />

          <IconButton 
            icon="camera-flip" 
            iconColor="white"
            size={24}
            style={styles.flipButton}
            onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}
          />
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>{t('learning.liveFeed')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          <Button 
            mode="contained-tonal" 
            onPress={pickImageForDetection} 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
            disabled={isProcessing || !isModelReady}
            icon="image"
          >
            {t('learning.photo')}
          </Button>

          <Button 
            mode="contained" 
            onPress={checkFromCamera} 
            style={[styles.actionButton, { flex: 1 }]}
            buttonColor={theme.colors.primary}
            disabled={isProcessing || !isModelReady}
            icon={() => <CheckCircle size={20} color="white" />}
          >
            {t('learning.check')}
          </Button>

          <Button 
            mode="outlined" 
            onPress={handleSkip} 
            style={styles.actionButton}
            icon={() => <SkipForward size={20} color={theme.colors.primary} />}
          >
            {t('learning.skip')}
          </Button>
        </View>
        {isProcessing && (
          <View style={{ position: 'absolute', top: -50, alignSelf: 'center', backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 4 }}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

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
    alignItems: 'center',
    padding: 24,
    paddingBottom: 12,
  },
  wordTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 10,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 4, // Gradient border width
    elevation: 8,
    shadowColor: '#ff9a9e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  cameraTopOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
  },
  boundingBoxContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boundingBox: {
    width: 224,
    height: 224,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  flipButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    borderRadius: 16,
    elevation: 2,
    justifyContent: 'center',
  },
});
