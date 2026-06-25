import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Camera } from 'react-native-vision-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

interface PracticeCameraPreviewProps {
  device: any;
  cameraRef: React.RefObject<any>;
  isCameraActive: boolean;
  facing: 'front' | 'back';
  setFacing: (facing: (prev: 'front' | 'back') => 'front' | 'back') => void;
}

export default function PracticeCameraPreview({
  device,
  cameraRef,
  isCameraActive,
  setFacing
}: PracticeCameraPreviewProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.cameraWrapper}>
      <LinearGradient 
        colors={['#ff9a9e', '#fecfef']} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.cameraContainer}>
        {device != null && (
          <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={isCameraActive} />
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
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 4,
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
});
