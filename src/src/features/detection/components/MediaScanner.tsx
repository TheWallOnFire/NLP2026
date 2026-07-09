import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { Camera } from 'react-native-vision-camera';
import { VideoView } from 'expo-video';

interface MediaScannerProps {
  detectionMode: 'live' | 'picture' | 'video' | 'batch' | 'auto';
  device: any;
  cameraRef: React.RefObject<any>;
  flash: boolean;
  activePackId: string | null;

  isLiveScanning: boolean;
  scanAnimStyle?: any;
  selectedMedia: string | null;
  player: any;
  pickImage: () => void;
  pickVideo: () => void;
  pickBatchImages?: () => void;
  isAppActive?: boolean;
  frameOutput?: any;
}

export default function MediaScanner({
  detectionMode,
  device,
  cameraRef,
  flash,
  activePackId,

  isLiveScanning,
  scanAnimStyle,
  selectedMedia,
  player,
  pickImage,
  pickVideo,
  pickBatchImages,
  isAppActive = true,
  frameOutput
}: MediaScannerProps) {

  // Tách const ra ngoài hoặc dùng memo để tránh re-render liên tục gây giật lag Camera
  const cameraConstraints = React.useMemo(() => [{ fps: 30 }], []);

  return (
    <>
      {detectionMode === 'live' || detectionMode === 'auto' ? (
        <View style={styles.cameraWrapper}>
          {device != null && isAppActive ? (
            <Camera 
              ref={cameraRef} 
              style={StyleSheet.absoluteFill} 
              device={device} 
              constraints={cameraConstraints}
              isActive={true} 
              torchMode={flash ? 'on' : 'off'} 
              outputs={frameOutput ? [frameOutput] : []}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
              {device == null ? <ActivityIndicator size="large" /> : <Text style={{ color: 'white' }}>Camera Paused</Text>}
            </View>
          )}
          {/* Scanning Reticle */}
          {detectionMode !== 'auto' && (
            <View style={styles.reticleContainer} pointerEvents="none">
              <View style={styles.reticle}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {activePackId && isLiveScanning && (
                  <Animated.View style={[styles.scanLine, scanAnimStyle]} />
                )}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.uploadWrapper}>
          {selectedMedia ? (
            detectionMode === 'picture' ? (
              // Fix Bug 10 UI/UX: Dùng Expo Image với hiệu ứng mờ dần (transition={200}) để loại bỏ khung hình đen nhấp nháy khi tải ảnh mới
              <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} contentFit="contain" transition={200} />
            ) : detectionMode === 'batch' ? (
              <View style={styles.emptyMedia}>
                 <IconButton icon="folder-multiple-image" size={64} iconColor="green" />
                 <Text variant="titleMedium">Selected Batch Folder</Text>
              </View>
            ) : (
              <View style={{ flex: 1, position: 'relative' }}>
                <VideoView player={player} style={{ flex: 1 }} allowsPictureInPicture nativeControls={true} contentFit="contain" />
              </View>
            )
          ) : (
            <View style={styles.emptyMedia}>
              <IconButton 
                icon={detectionMode === 'picture' ? "image-plus" : detectionMode === 'batch' ? "folder-multiple-image" : "video-plus"} 
                size={64} 
                onPress={detectionMode === 'picture' ? pickImage : detectionMode === 'batch' ? pickBatchImages : pickVideo}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
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
