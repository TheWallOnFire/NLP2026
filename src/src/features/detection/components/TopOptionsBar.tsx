import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text, Menu, Divider } from 'react-native-paper';
import { Camera as CameraIcon, Image as ImageIcon, Video as VideoIcon, ChevronDown, Menu as MenuIcon, Brain } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface TopOptionsBarProps {
  theme: any;
  detectionMode: 'live' | 'picture' | 'video' | 'batch' | 'auto';
  setDetectionMode: (mode: 'live' | 'picture' | 'video' | 'batch' | 'auto') => void;
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
        contentStyle={styles.menuContent}
        anchor={
          <TouchableOpacity onPress={() => setIsModeMenuOpen(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.primaryContainer || 'rgba(0,100,255,0.15)', theme.colors.surfaceVariant || 'rgba(0,50,150,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.dropdownBtn, { borderColor: theme.colors.primary }]}
            >
              {detectionMode === 'live' ? <CameraIcon color={theme.colors.primary} size={18} /> : 
               detectionMode === 'picture' ? <ImageIcon color={theme.colors.primary} size={18} /> :
               detectionMode === 'batch' ? <MenuIcon color={theme.colors.primary} size={18} /> :
               detectionMode === 'auto' ? <Brain color={theme.colors.primary} size={18} /> :
               <VideoIcon color={theme.colors.primary} size={18} />}
              <Text style={[styles.dropdownText, { color: theme.colors.primary }]}>{detectionMode.toUpperCase()}</Text>
              <ChevronDown color={theme.colors.primary} size={16} />
            </LinearGradient>
          </TouchableOpacity>
        }
      >
        <Menu.Item onPress={() => { setDetectionMode('live'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title={t('detection.liveCamera')} leadingIcon="camera" />
        <Menu.Item onPress={() => { setDetectionMode('picture'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title={t('detection.imageUpload')} leadingIcon="image" />
        <Menu.Item onPress={() => { setDetectionMode('video'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title={t('detection.videoUpload')} leadingIcon="video" />
        <Menu.Item onPress={() => { setDetectionMode('batch'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title="Batch Upload (Folder)" leadingIcon="folder-multiple-image" />
        <Divider style={styles.divider} />
        <Menu.Item onPress={() => { setDetectionMode('auto'); setIsModeMenuOpen(false); setSelectedMedia(null); setIsLiveScanning(false); }} title="Auto Detection" leadingIcon="robot" />
      </Menu>

      <Menu
        visible={isModelMenuOpen}
        onDismiss={() => setIsModelMenuOpen(false)}
        contentStyle={styles.menuContent}
        anchor={
          <TouchableOpacity onPress={() => setIsModelMenuOpen(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.secondaryContainer || 'rgba(0,255,150,0.15)', theme.colors.surfaceVariant || 'rgba(0,150,100,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.dropdownBtn, { borderColor: theme.colors.secondary }]}
            >
              <Brain color={activePackId ? theme.colors.secondary : theme.colors.error} size={18} />
              <Text style={[styles.dropdownText, { color: activePackId ? theme.colors.secondary : theme.colors.error, maxWidth: 110 }]} numberOfLines={1}>
                {activePack ? activePack.name : (customModelUri ? t('detection.customModel') : t('detection.selectModel'))}
              </Text>
              <ChevronDown color={activePackId ? theme.colors.secondary : theme.colors.error} size={16} />
            </LinearGradient>
          </TouchableOpacity>
        }
      >
        {downloadedPacks.map(pack => (
          <Menu.Item 
            key={pack.id}
            onPress={() => { setActivePack(pack.id); setCustomModelUri(null); setIsModelMenuOpen(false); }}
            title={pack.name}
            leadingIcon="brain"
            trailingIcon={activePackId === pack.id && !customModelUri ? "check-circle" : undefined}
          />
        ))}
        <Divider style={styles.divider} />
        <Menu.Item 
          onPress={() => { pickModelFile(); setIsModelMenuOpen(false); }}
          title={t('detection.loadTflite')}
          leadingIcon="folder-open"
          trailingIcon={customModelUri ? "check-circle" : undefined}
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
    paddingTop: Platform.OS === 'ios' ? 14 : 10,
    paddingBottom: 10,
    zIndex: 10,
    elevation: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownText: {
    marginHorizontal: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuContent: {
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  divider: {
    marginVertical: 4,
    opacity: 0.5,
  }
});
