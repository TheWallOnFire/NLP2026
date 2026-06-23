import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { Camera } from 'react-native-vision-camera';
import { VideoView } from 'expo-video';
import VideoController from './VideoController';

interface MediaScannerProps {
  detectionMode: 'live' | 'picture' | 'video';
  device: any;
  cameraRef: React.RefObject<any>;
  flash: boolean;
  activePackId: string | null;
  detectionSpeed: string;
  isLiveScanning: boolean;
  scanAnimStyle?: any;
  selectedMedia: string | null;
  player: any;
  pickImage: () => void;
  pickVideo: () => void;
  isAppActive?: boolean;
}

export default function MediaScanner({
  detectionMode,
  device,
  cameraRef,
  flash,
  activePackId,
  detectionSpeed,
  isLiveScanning,
  scanAnimStyle,
  selectedMedia,
  player,
  pickImage,
  pickVideo,
  isAppActive = true
}: MediaScannerProps) {
  return (
    <>
      {detectionMode === 'live' ? (
        <View style={styles.cameraWrapper}>
          {device != null && isAppActive ? (
            <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} torchMode={flash ? 'on' : 'off'} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
              {device == null ? <ActivityIndicator size="large" /> : <Text style={{ color: 'white' }}>Camera Paused</Text>}
            </View>
          )}
          {/* Scanning Reticle */}
          <View style={styles.reticleContainer} pointerEvents="none">
            <View style={styles.reticle}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {detectionSpeed !== 'off' && activePackId && isLiveScanning && (
                <Animated.View style={[styles.scanLine, scanAnimStyle]} />
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.uploadWrapper}>
          {selectedMedia ? (
            detectionMode === 'picture' ? (
              <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} resizeMode="contain" />
            ) : (
              <View style={{ flex: 1, position: 'relative' }}>
                <VideoView player={player} style={styles.mediaPreview} allowsPictureInPicture />
                <VideoController player={player} />
              </View>
            )
          ) : (
            <View style={styles.emptyMedia}>
              <IconButton 
                icon={detectionMode === 'picture' ? "image-plus" : "video-plus"} 
                size={64} 
                onPress={detectionMode === 'picture' ? pickImage : pickVideo}
                accessibilityLabel={detectionMode === 'picture' ? "Chọn ảnh từ thư viện" : "Chọn video từ thư viện"}
              />
              <Text variant="bodyLarge">No Media Selected</Text>
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    flex: 1,
  },
  uploadWrapper: {
    flex: 1,
  },
  mediaPreview: {
    flex: 1,
  },
  emptyMedia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: '100%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});
