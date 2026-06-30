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
import Animated, { useAnimatedStyle, withTiming, withSpring, SharedValue, interpolate, Extrapolation, withRepeat, withSequence } from 'react-native-reanimated';
import { Text } from 'react-native-paper';

interface AutoModeBoundingBoxProps {
  boxX: SharedValue<number>;
  boxY: SharedValue<number>;
  boxWidth: SharedValue<number>;
  boxHeight: SharedValue<number>;
  boxVisible: SharedValue<number>;
  statusText?: string;
  imageRatio?: number;
}

export default function AutoModeBoundingBox({
  boxX,
  boxY,
  boxWidth,
  boxHeight,
  boxVisible,
  statusText,
  imageRatio = 3/4,
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

    const viewRatio = containerSize.width / containerSize.height;
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
    
    if (imageRatio > viewRatio) {
      scaleY = containerSize.height; 
      scaleX = containerSize.height * imageRatio; 
      offsetX = (scaleX - containerSize.width) / 2;
    } else {
      scaleX = containerSize.width;
      scaleY = containerSize.width / imageRatio;
      offsetY = (scaleY - containerSize.height) / 2;
    }

    const bx = boxX.value * scaleX - offsetX;
    const by = boxY.value * scaleY - offsetY;
    const bw = boxWidth.value * scaleX;
    const bh = boxHeight.value * scaleY;
    
    return {
      position: 'absolute',
      left: withSpring(bx, { damping: 15, stiffness: 120, mass: 0.8 }),
      top: withSpring(by, { damping: 15, stiffness: 120, mass: 0.8 }),
      width: withSpring(bw, { damping: 15, stiffness: 120, mass: 0.8 }),
      height: withSpring(bh, { damping: 15, stiffness: 120, mass: 0.8 }),
      opacity,
      borderWidth: 4,
      borderColor: '#4CAF50',
      borderStyle: 'solid' as const,
      borderRadius: 12,
      zIndex: 999,
      elevation: 999,
    };
  }, [containerSize]);

  // Animated pulse effect (luôn chạy khi hiển thị)
  const pulseStyle = useAnimatedStyle(() => {
    if (boxVisible.value === 0 || containerSize.width === 0) {
      return { opacity: 0 };
    }
    
    const viewRatio = containerSize.width / containerSize.height;
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
    
    if (imageRatio > viewRatio) {
      scaleY = containerSize.height; 
      scaleX = containerSize.height * imageRatio; 
      offsetX = (scaleX - containerSize.width) / 2;
    } else {
      scaleX = containerSize.width;
      scaleY = containerSize.width / imageRatio;
      offsetY = (scaleY - containerSize.height) / 2;
    }
    
    const bx = boxX.value * scaleX - offsetX;
    const by = boxY.value * scaleY - offsetY;
    const bw = boxWidth.value * scaleX;
    const bh = boxHeight.value * scaleY;
    
    return {
      position: 'absolute',
      left: withSpring(bx - 4, { damping: 15, stiffness: 120, mass: 0.8 }),
      top: withSpring(by - 4, { damping: 15, stiffness: 120, mass: 0.8 }),
      width: withSpring(bw + 8, { damping: 15, stiffness: 120, mass: 0.8 }),
      height: withSpring(bh + 8, { damping: 15, stiffness: 120, mass: 0.8 }),
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
  }, [containerSize]);

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
        <View style={[styles.corner, styles.topLeft, { borderColor: '#4CAF50' }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: '#4CAF50' }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: '#4CAF50' }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: '#4CAF50' }]} />
      </Animated.View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: 'rgba(76, 175, 80, 0.85)' }
        ]}>
          <View style={[styles.statusDot, { backgroundColor: '#A5D6A7' }]} />
          <Text style={styles.statusText}>
            {statusText || 'Bám sát mục tiêu'}
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
