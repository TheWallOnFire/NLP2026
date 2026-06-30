import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Menu, IconButton } from 'react-native-paper';
import { RotateCcw, Zap, ZapOff, Timer, FolderOpen, Link } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface DetectionSidebarProps {
  theme: any;
  detectionMode: 'live' | 'picture' | 'video' | 'batch' | 'auto';

  updateSettings: (settings: any) => void;
  toggleCameraFacing: () => void;
  toggleFlash: () => void;
  flash: boolean;
  pickImage: () => void;
  pickVideo: () => void;
  pickBatchImages?: () => void;
  isLiveScanning: boolean;
  isProcessing: boolean;
  activePackId: string | null;
  selectedMedia: string | null;
  onPressManualScan: () => void;
  setIsUrlDialogOpen?: (val: boolean) => void;
}

export default function DetectionSidebar({
  theme,
  detectionMode,

  updateSettings,
  toggleCameraFacing,
  toggleFlash,
  flash,
  pickImage,
  pickVideo,
  pickBatchImages,
  isLiveScanning,
  isProcessing,
  activePackId,
  selectedMedia,
  onPressManualScan,
  setIsUrlDialogOpen
}: DetectionSidebarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.verticalSidebar}>
      {detectionMode === 'live' || detectionMode === 'auto' ? (
        <>

          <IconButton icon={() => <RotateCcw color="white" size={24} />} style={styles.sideBtn} onPress={toggleCameraFacing} />
          <IconButton icon={() => (flash ? <Zap color="#FFD600" size={24} /> : <ZapOff color="white" size={24} />)} style={styles.sideBtn} onPress={toggleFlash} />
          <IconButton icon={() => <Timer color="white" size={24} />} style={styles.sideBtn} onPress={() => Alert.alert(t('detection.countdownTitle'), t('detection.comingSoon'))} />
        </>
      ) : (
        <>
          <IconButton icon={() => <FolderOpen color="white" size={24} />} style={styles.sideBtn} onPress={detectionMode === 'picture' ? pickImage : detectionMode === 'batch' && pickBatchImages ? pickBatchImages : pickVideo} />
          {detectionMode === 'picture' && setIsUrlDialogOpen && (
            <IconButton icon={() => <Link color="white" size={24} />} style={styles.sideBtn} onPress={() => setIsUrlDialogOpen(true)} />
          )}
        </>
      )}
      
      {/* Manual Analyze Button */}
      <IconButton 
        icon={
          detectionMode === 'auto' 
            ? (isLiveScanning ? "stop-circle" : "play-circle") 
            : (detectionMode === 'live') 
              ? (isLiveScanning ? "stop-circle" : "play-circle") 
              : "scan-helper"
        } 
        containerColor={isLiveScanning ? theme.colors.error : theme.colors.primary} 
        iconColor="white" 
        style={[styles.sideBtn, { marginTop: 20 }]} 
        onPress={onPressManualScan} 
        disabled={(!isLiveScanning && isProcessing) || !activePackId || ((detectionMode !== 'live' && detectionMode !== 'auto') && !selectedMedia)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  verticalSidebar: {
    position: 'absolute',
    left: 10,
    top: '20%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  sideBtn: {
    marginVertical: 4,
  },
});
