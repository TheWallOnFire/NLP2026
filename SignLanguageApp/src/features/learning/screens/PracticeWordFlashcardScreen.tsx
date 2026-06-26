import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, AppState } from 'react-native';
import { Appbar, Text, Button, useTheme, Snackbar, ActivityIndicator, IconButton } from 'react-native-paper';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { usePracticeWordLogic } from '../hooks/usePracticeWordLogic';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../constants/routes';

export default function PracticeWordFlashcardScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { packId, filterType, wordCount } = route.params || {};
  const theme = useTheme();
  
  const cameraRef = useRef<any>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  
  const {
    currentWord,
    currentIndex,
    practiceWords,
    isFinished,
    isProcessing,
    snackbarMsg,
    setSnackbarMsg,
    snackbarColor,
    isModelReady,
    checkFromCamera,
    handleSkip,
    facing,
    setFacing
  } = usePracticeWordLogic(packId, filterType, wordCount, cameraRef);

  const device = useCameraDevice(facing);
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => setIsAppActive(next === 'active'));
    return () => sub.remove();
  }, []);

  // Flashcard Animation
  const flipAnim = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  // Reset flip when word changes
  useEffect(() => {
    setFlipped(false);
    setImageError(false);
    flipAnim.value = 0;
  }, [currentWord]);

  const handleFlip = () => {
    setFlipped(!flipped);
    flipAnim.value = withSpring(flipped ? 0 : 180, { damping: 12, stiffness: 90 });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(flipAnim.value, [0, 180], [0, 180]);
    return { transform: [{ rotateY: `${spinVal}deg` }] };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(flipAnim.value, [0, 180], [180, 360]);
    return { transform: [{ rotateY: `${spinVal}deg` }] };
  });

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium">{t('learning.cameraPermissionNeeded')}</Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 20 }}>{t('learning.grantPermission')}</Button>
      </View>
    );
  }

  if (isFinished || practiceWords.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated style={{ width: '100%', position: 'absolute', top: 0 }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Hoàn thành" />
        </Appbar.Header>
        <Text variant="headlineMedium">{t('learning.testFinished')}</Text>
        <Text variant="bodyLarge" style={{ marginTop: 10 }}>{t('learning.wordsPracticed', { count: practiceWords.length })}</Text>
        <Button mode="contained" onPress={() => navigation.navigate(ROUTES.PACK_DETAIL, { packId })} style={{ marginTop: 30 }}>
          {t('learning.goBack')}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('learning.wordOfWord', { current: currentIndex + 1, total: practiceWords.length })} />
      </Appbar.Header>

      <View style={styles.flashcardContainer}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
          {/* MẶT TRƯỚC (CHỮ) */}
          <Animated.View style={[styles.card, frontAnimatedStyle, { backgroundColor: theme.colors.primaryContainer, backfaceVisibility: 'hidden' }]}>
            <Text variant="displayLarge" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
              {currentWord?.word}
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 20, color: 'gray' }}>{t('learning.tapToFlip')}</Text>
          </Animated.View>
          
          {/* MẶT SAU (ẢNH) */}
          <Animated.View style={[styles.card, backAnimatedStyle, styles.cardBack, { backgroundColor: theme.colors.secondaryContainer, backfaceVisibility: 'hidden' }]}>
            {!imageError ? (
              <Image 
                source={{ uri: `${FileSystem.documentDirectory}packs/${packId}/word_images/${currentWord?.word}.png` }}
                style={styles.cardImage}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.errorImage}>
                <Text>{t('learning.noImage')}</Text>
              </View>
            )}
            <Text variant="titleLarge" style={{ marginTop: 10, fontWeight: 'bold' }}>{currentWord?.word}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        {device ? (
          <View style={styles.cameraWrapper}>
            <Camera 
              ref={cameraRef} 
              style={StyleSheet.absoluteFill} 
              device={device} 
              isActive={isFocused && isAppActive} 
            />
            <View style={styles.boundingBox} />
            <IconButton 
              icon="camera-flip" 
              iconColor="white"
              style={styles.flipBtn}
              onPress={() => setFacing(prev => prev === 'front' ? 'back' : 'front')}
            />
          </View>
        ) : (
          <Text>Loading Camera...</Text>
        )}
      </View>

      <View style={styles.controls}>
        <Button 
          mode="outlined" 
          style={styles.btn} 
          onPress={handleSkip} 
          disabled={isProcessing}
        >
          {t('learning.skip')}
        </Button>
        <Button 
          mode="contained" 
          style={styles.btn} 
          onPress={checkFromCamera} 
          disabled={!isModelReady || isProcessing}
          icon={() => isProcessing ? <ActivityIndicator size={16} color="white" /> : null}
        >
          {isProcessing ? t('learning.checking') : t('learning.check')}
        </Button>
      </View>

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg("")}
        duration={2000}
        style={{ backgroundColor: snackbarColor === 'green' ? '#4CAF50' : '#F44336' }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{snackbarMsg}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  flashcardContainer: {
    height: '40%',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ perspective: 1000 }],
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  cardImage: {
    width: '80%',
    height: '70%',
    borderRadius: 12,
  },
  errorImage: {
    width: '80%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  cameraContainer: {
    height: '40%',
    paddingHorizontal: 20,
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boundingBox: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.7)',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  flipBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controls: {
    height: '20%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  btn: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 5,
  }
});
