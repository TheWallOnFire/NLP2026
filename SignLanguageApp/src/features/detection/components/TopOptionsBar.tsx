import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Menu, Divider } from 'react-native-paper';
import { Camera as CameraIcon, Image as ImageIcon, Video as VideoIcon, ChevronDown, Menu as MenuIcon, Brain } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface TopOptionsBarProps {
  theme: any;
  detectionMode: 'live' | 'picture' | 'video' | 'batch';
  setDetectionMode: (mode: 'live' | 'picture' | 'video' | 'batch') => void;
  setSelectedMedia: (media: string | null) => void;
  setIsLiveScanning: (scanning: boolean) => void;
  activePackId: string | null;
  activePack: any;
  setActivePack: (id: string) => void;
  customModelUri: string | null;
  setCustomModelUri: (uri: string | null) => void;
  downloadedPacks: any[];
  pickModelFile: () => void;
}

export default function TopOptionsBar({
  theme,
  detectionMode,
  setDetectionMode,
  setSelectedMedia,
  setIsLiveScanning,
  activePackId,
  activePack,
  setActivePack,
  customModelUri,
  setCustomModelUri,
  downloadedPacks,
  pickModelFile
}: TopOptionsBarProps) {
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <View style={styles.topBar}>
      <Menu
        visible={isModeMenuOpen}
        onDismiss={() => setIsModeMenuOpen(false)}
        anchor={
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsModeMenuOpen(true)}>
            {detectionMode === 'live' ? <CameraIcon color={theme.colors.primary} size={18} /> : 
             detectionMode === 'picture' ? <ImageIcon color={theme.colors.primary} size={18} /> :
             detectionMode === 'batch' ? <MenuIcon color={theme.colors.primary} size={18} /> :
             <VideoIcon color={theme.colors.primary} size={18} />}
            <Text style={styles.dropdownText}>{detectionMode.toUpperCase()}</Text>
            <ChevronDown color={theme.colors.onSurface} size={16} />
          </TouchableOpacity>
        }
        >
        <Menu.Item onPress={() => { setDetectionMode('live'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title={t('detection.liveCamera')} />
        <Menu.Item onPress={() => { setDetectionMode('picture'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title={t('detection.imageUpload')} />
        <Menu.Item onPress={() => { setDetectionMode('video'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title={t('detection.videoUpload')} />
        <Menu.Item onPress={() => { setDetectionMode('batch'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title="Batch Upload (Folder)" />
      </Menu>

      <Menu
        visible={isModelMenuOpen}
        onDismiss={() => setIsModelMenuOpen(false)}
        anchor={
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsModelMenuOpen(true)}>
            <Brain color={activePackId ? theme.colors.primary : theme.colors.error} size={18} />
            <Text style={[styles.dropdownText, { maxWidth: 120 }]} numberOfLines={1}>
              {activePack ? activePack.name : (customModelUri ? t('detection.customModel') : t('detection.selectModel'))}
            </Text>
            <ChevronDown color={theme.colors.onSurface} size={16} />
          </TouchableOpacity>
        }
      >
        {downloadedPacks.map(pack => (
          <Menu.Item 
            key={pack.id}
            onPress={() => { setActivePack(pack.id); setCustomModelUri(null); setIsModelMenuOpen(false); }}
            title={pack.name}
            trailingIcon={activePackId === pack.id && !customModelUri ? "check" : undefined}
          />
        ))}
        <Divider />
        <Menu.Item 
          onPress={() => { pickModelFile(); setIsModelMenuOpen(false); }}
          title={t('detection.loadTflite')}
          trailingIcon={customModelUri ? "check" : undefined}
        />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 10,
    elevation: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100,100,100,0.2)',
  },
  dropdownText: {
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
});
