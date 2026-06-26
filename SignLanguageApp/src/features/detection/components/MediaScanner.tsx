import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { Camera } from 'react-native-vision-camera';
import { VideoView } from 'expo-video';
import VideoController from './VideoController';

interface MediaScannerProps {
  detectionMode: 'live' | 'picture' | 'video' | 'batch' | 'auto';
  device: any;
  cameraRef: React.RefObject<any>;
  flash: boolean;
  activePackId: string | null;
  detectionSpeed: string;
  isLiveScanning: boolean;
  selectedMedia: string | null;
  player: any;
  pickImage: () => void;
  pickVideo: () => void;
  pickBatchImages?: () => void;
  isAppActive?: boolean;
  frameOutput?: any;
  handBox?: any;
  autoState?: any;
}

export default function MediaScanner({
  detectionMode,
  device,
  cameraRef,
  flash,
  activePackId,
  detectionSpeed,
  isLiveScanning,
  selectedMedia,
  player,
  pickImage,
  pickVideo,
  pickBatchImages,
  isAppActive = true,
  frameOutput,
  handBox,
  autoState
}: MediaScannerProps) {

  // Tách const ra ngoài hoặc dùng memo để tránh re-render liên tục gây giật lag Camera
  const cameraConstraints = React.useMemo(() => [{ fps: 30 }], []);

  const handBoxStyle = useAnimatedStyle(() => {
    if (!handBox || handBox.value.score < 0.0) {
      return { 
        opacity: withTiming(0, { duration: 300 }), // Fix Bug 31: Fade out mượt mà
        borderColor: 'transparent',
        backgroundColor: 'transparent'
      };
    }
    // Thuật toán ánh xạ toạ độ từ Tensor 1:1 (Resizer) sang màn hình điện thoại 9:20 (Cover)
    // 1. Resizer cắt khung hình 9:16 thành 1:1 (cắt trên/dưới)
    const x_sensor = handBox.value.x;
    const y_sensor = 0.21875 + handBox.value.y * 0.5625;
    const w_sensor = handBox.value.w;
    const h_sensor = handBox.value.h * 0.5625;

    // 2. Camera Preview phóng to 9:16 lên 9:20 (cắt trái/phải)
    // Hệ số bù x là (9/16) / (9/20) = 1.25
    const x_screen = (x_sensor - 0.5) * 1.25 + 0.5;
    const w_screen = w_sensor * 1.25;
    const y_screen = y_sensor;
    const h_screen = h_sensor;

    // Fix Bug 32: Visual Feedback cho Trạng thái
    let color = 'rgba(0, 255, 0, 1)'; // State 0 (Searching): Xanh lá
    let bgColor = 'rgba(0, 255, 0, 0.1)';
    if (autoState && autoState.value === 1) {
       color = 'rgba(255, 165, 0, 1)'; // State 1 (Locking): Cam
       bgColor = 'rgba(255, 165, 0, 0.2)';
    } else if (autoState && autoState.value === 2) {
       color = 'rgba(255, 0, 0, 1)'; // State 2 (Scanning): Đỏ
       bgColor = 'rgba(255, 0, 0, 0.3)';
    }

    return {
      opacity: withTiming(1, { duration: 150 }),
      left: `${x_screen * 100}%`,
      top: `${y_screen * 100}%`,
      width: `${w_screen * 100}%`,
      height: `${h_screen * 100}%`,
      borderColor: color,
      backgroundColor: bgColor
    };
  });

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
          
          {/* Khung khóa mục tiêu bàn tay cho Auto Mode */}
          {detectionMode === 'auto' && handBox && (
            <Animated.View style={[styles.handBox, handBoxStyle]} pointerEvents="none">
               <View style={styles.handBoxCornerTopLeft} />
               <View style={styles.handBoxCornerTopRight} />
               <View style={styles.handBoxCornerBottomLeft} />
               <View style={styles.handBoxCornerBottomRight} />
            </Animated.View>
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
                <VideoView player={player} style={styles.mediaPreview} allowsPictureInPicture />
                <VideoController player={player} />
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
  handBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
  },
  handBoxCornerTopLeft: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  handBoxCornerTopRight: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  handBoxCornerBottomLeft: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  handBoxCornerBottomRight: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
});
