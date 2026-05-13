import React, { useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { triggerSelectionFeedback } from '../../../utils/feedback';

export default function DetectionScreen() {
  const theme = useTheme();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    const isPermanentDenial = !permission.canAskAgain;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.message}>
          {isPermanentDenial 
            ? "Camera permission was denied permanently. Please enable it in your system settings to use the detector." 
            : "We need your permission to show the camera."}
        </Text>
        <Button 
          mode="contained" 
          onPress={isPermanentDenial ? () => Linking.openSettings() : requestPermission} 
          style={styles.button}
        >
          {isPermanentDenial ? "Open System Settings" : "Grant Permission"}
        </Button>
      </View>
    );
  }

  function toggleCameraFacing() {
    triggerSelectionFeedback();
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          {/* Overlay elements like bounding boxes will go here */}
          <Text style={styles.overlayText}>Model: ASL Basics (Live)</Text>
        </View>
        <View style={styles.buttonContainer}>
          <IconButton 
            icon="camera-flip" 
            iconColor="white" 
            size={32} 
            onPress={toggleCameraFacing}
            style={styles.iconButton}
          />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  button: {
    marginHorizontal: 40,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  overlayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  iconButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  },
});
