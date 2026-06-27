/**
 * AutoModeBoundingBox.tsx
 * 
 * Component hiển thị Bounding Box (khung xanh) bao quanh bàn tay trong Auto Mode.
 * Sử dụng Reanimated Shared Values để render trên UI Thread, 
 * đảm bảo 0ms delay (không cần qua JS Bridge).
 * 
 * Được vẽ chồng lên trên Camera (zIndex: 999, elevation: 999)
 * để không bị đè bởi native Camera SurfaceView.
 */

import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, SharedValue, interpolate, Extrapolation, withRepeat, withSequence } from 'react-native-reanimated';
import { Text } from 'react-native-paper';

interface AutoModeBoundingBoxProps {
  boxX: SharedValue<number>;
  boxY: SharedValue<number>;
  boxWidth: SharedValue<number>;
  boxHeight: SharedValue<number>;
  boxVisible: SharedValue<number>;
  autoState: number; // 0 = Searching, 1 = Locking
  statusText?: string;
}

export default function AutoModeBoundingBox({
  boxX,
  boxY,
  boxWidth,
  boxHeight,
  boxVisible,
  autoState,
  statusText,
}: AutoModeBoundingBoxProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Lấy kích thước thực tế của View bao quanh Camera để scale tọa độ [0..1]
  const onLayout = (e: LayoutChangeEvent) => {
    setContainerSize({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height
    });
  };

  // Animated style cho bounding box - chạy trên UI Thread
  const boundingBoxStyle = useAnimatedStyle(() => {
    const opacity = withTiming(boxVisible.value, { duration: 200 });
    
    // Nếu chưa có kích thước container, ẩn box
    if (containerSize.width === 0) return { opacity: 0 };
    
    return {
      position: 'absolute',
      left: withTiming(boxX.value * containerSize.width, { duration: 150 }),
      top: withTiming(boxY.value * containerSize.height, { duration: 150 }),
      width: withTiming(boxWidth.value * containerSize.width, { duration: 150 }),
      height: withTiming(boxHeight.value * containerSize.height, { duration: 150 }),
      opacity,
      borderWidth: 4,
      borderColor: autoState === 1 ? '#4CAF50' : '#2196F3',
      borderStyle: 'solid' as const,
      borderRadius: 12,
      zIndex: 999,
      elevation: 999,
    };
  }, [autoState, containerSize]);

  // Animated pulse effect cho trạng thái Locking
  const pulseStyle = useAnimatedStyle(() => {
    if (autoState !== 1 || boxVisible.value === 0 || containerSize.width === 0) {
      return { opacity: 0 };
    }
    
    const bx = boxX.value * containerSize.width;
    const by = boxY.value * containerSize.height;
    const bw = boxWidth.value * containerSize.width;
    const bh = boxHeight.value * containerSize.height;
    
    return {
      position: 'absolute',
      left: withTiming(bx - 4, { duration: 150 }),
      top: withTiming(by - 4, { duration: 150 }),
      width: withTiming(bw + 8, { duration: 150 }),
      height: withTiming(bh + 8, { duration: 150 }),
      borderWidth: 2,
      borderColor: 'rgba(76, 175, 80, 0.4)',
      borderRadius: 14,
      opacity: withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(0.8, { duration: 800 })
        ),
        -1,
        true
      ),
      zIndex: 998,
      elevation: 998,
    };
  }, [autoState]);

  // Corner decorations animated style
  const cornerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(boxVisible.value, { duration: 200 }),
    };
  });

  return (
    <View style={styles.container} pointerEvents="none" onLayout={onLayout}>
      {/* Pulse effect - lớp glow bên ngoài */}
      <Animated.View style={pulseStyle} />
      
      {/* Main bounding box */}
      <Animated.View style={boundingBoxStyle}>
        {/* Corner decorations cho visual effect */}
        <View style={[styles.corner, styles.topLeft, { borderColor: autoState === 1 ? '#4CAF50' : '#2196F3' }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: autoState === 1 ? '#4CAF50' : '#2196F3' }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: autoState === 1 ? '#4CAF50' : '#2196F3' }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: autoState === 1 ? '#4CAF50' : '#2196F3' }]} />
      </Animated.View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: autoState === 1 ? 'rgba(76, 175, 80, 0.85)' : 'rgba(33, 150, 243, 0.85)' }
        ]}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: autoState === 1 ? '#A5D6A7' : '#90CAF9' }
          ]} />
          <Text style={styles.statusText}>
            {statusText || (autoState === 1 ? '🔒 Đã khóa' : '🔍 Đang tìm...')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
