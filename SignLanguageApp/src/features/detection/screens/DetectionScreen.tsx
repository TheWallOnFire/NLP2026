import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Linking, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { History as HistoryIcon, ListTodo, Save } from 'lucide-react-native';

import TopOptionsBar from '../components/TopOptionsBar';
import MediaScanner from '../components/MediaScanner';
import DetectionSidebar from '../components/DetectionSidebar';
import DetectionResultBanner from '../components/DetectionResultBanner';
import DetectionDialogs from '../components/DetectionDialogs';
import DebugOverlay from '../components/DebugOverlay';
import AutoModeBoundingBox from '../components/AutoModeBoundingBox';

import { useDetectionLogic } from '../hooks/useDetectionLogic';

export default function DetectionScreen({ navigation }: any) {
  const { t } = useTranslation();
  
  // Using setDetectionMode from useDetectionLogic directly

  const {
    theme, developerDebugMode, facing, flash, hasPermission, requestPermission, device,
    activePackId, activePack, setActivePack, customModelUri, setCustomModelUri, downloadedPacks,
    sessionHistory, setSessionHistory, onSaveSession, onSaveMediaSession, onSaveAutoSession,
    debugData, isDebugDialogOpen, setIsDebugDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    isConfirmImageDialogOpen, setIsConfirmImageDialogOpen,
    imageToAnalyze, imageToAnalyzeSize, confirmImageAnalysis,
    detectedWord, confidence, detectionSpeed, updateSettings,
    detectionMode, setDetectionMode,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia,
    isProcessing, snackbarMsg, setSnackbarMsg,
    frameOutput, isUrlDialogOpen, setIsUrlDialogOpen, urlInput, setUrlInput,
    player, scanAnimStyle, camera, isAppActive, isFocused,
    onPressManualScan, pickImage, pickVideo, pickBatchImages, handleUrlImage, pickModelFile,
    toggleCameraFacing, toggleFlash, clearQueue, packWords, modelShape,
    batchResults, isBatchResultDialogOpen, setIsBatchResultDialogOpen,
    // Auto Mode
    autoDetection,
    isAutoModeActive,
  } = useDetectionLogic(navigation);

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <IconButton icon="camera-off" size={64} iconColor={theme.colors.error} />
          <Text variant="headlineSmall" style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.message}>
            We need your permission to access the camera for real-time sign language detection. If you have denied it previously, you may need to open system settings.
          </Text>
          <Button mode="contained" onPress={async () => {
            const granted = await requestPermission();
            if (!granted) {
              Alert.alert(
                "Yêu cầu Quyền Camera",
                "Vui lòng vào Cài đặt của hệ thống để cấp quyền Máy ảnh cho ứng dụng.",
                [
                  { text: "Hủy", style: "cancel" },
                  { text: "Mở Cài đặt", onPress: () => Linking.openSettings() }
                ]
              );
            }
          }} style={{ borderRadius: 24 }}>
            Grant Permission / Open Settings
          </Button>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <TopOptionsBar
        theme={theme}
        detectionMode={detectionMode}
        setDetectionMode={setDetectionMode}
        setSelectedMedia={setSelectedMedia}
        setIsLiveScanning={setIsLiveScanning}
        activePackId={activePackId}
        activePack={activePack}
        setActivePack={setActivePack}
        customModelUri={customModelUri}
        setCustomModelUri={setCustomModelUri}
        downloadedPacks={downloadedPacks}
        pickModelFile={pickModelFile}
      />

      <View style={styles.mediaContainer}>
        {developerDebugMode && (
          <DebugOverlay
            debugData={debugData}
            activePackWords={packWords[activePackId || '']?.map((w: any) => w.word) || []}
          />
        )}

        <MediaScanner
          key={`scanner-${modelShape?.[1] || 224}-${detectionSpeed}`}
          detectionMode={detectionMode}
          device={device}
          cameraRef={camera}
          flash={flash}
          activePackId={activePackId}
          detectionSpeed={detectionSpeed}
          isLiveScanning={isLiveScanning}
          scanAnimStyle={scanAnimStyle}
          selectedMedia={selectedMedia}
          player={player}
          pickImage={pickImage}
          pickVideo={pickVideo}
          pickBatchImages={pickBatchImages}
          isAppActive={isAppActive && isFocused}
          frameOutput={frameOutput}
        />

        {/* Auto Mode: Bounding Box Overlay */}
        {detectionMode === 'auto' && isLiveScanning && autoDetection && (
          <AutoModeBoundingBox
            boxX={autoDetection.boxX}
            boxY={autoDetection.boxY}
            boxWidth={autoDetection.boxWidth}
            boxHeight={autoDetection.boxHeight}
            boxVisible={autoDetection.boxVisible}
            statusText={autoDetection.statusText}
          />
        )}

        {/* Result Banner - Ẩn khi Auto Mode vì hiển thị status badge riêng */}
        {detectionMode !== 'auto' && (
          <View style={styles.topResultOverlay}>
            <DetectionResultBanner
              theme={theme}
              activePack={activePack}
              detectedWord={detectedWord}
              confidence={confidence}
            />
          </View>
        )}

        {/* Auto Mode: Kết quả nhận diện hiện tại */}
        {detectionMode === 'auto' && isLiveScanning && detectedWord && (
          <View style={styles.autoResultOverlay}>
            <View style={[
              styles.autoResultBadge,
              { 
                backgroundColor: confidence > 0.8 
                  ? 'rgba(76, 175, 80, 0.9)' 
                  : confidence > 0.6 
                    ? 'rgba(255, 152, 0, 0.9)' 
                    : 'rgba(244, 67, 54, 0.9)' 
              }
            ]}>
              <Text style={styles.autoResultText}>{detectedWord}</Text>
              <Text style={styles.autoResultConf}>{Math.round(confidence * 100)}%</Text>
            </View>
          </View>
        )}

        <DetectionSidebar
          theme={theme}
          detectionMode={detectionMode}
          detectionSpeed={detectionSpeed}
          updateSettings={updateSettings}
          toggleCameraFacing={toggleCameraFacing}
          toggleFlash={toggleFlash}
          flash={flash}
          pickImage={pickImage}
          pickVideo={pickVideo}
          pickBatchImages={pickBatchImages}
          isLiveScanning={isLiveScanning}
          isProcessing={isProcessing}
          activePackId={activePackId}
          selectedMedia={selectedMedia}
          onPressManualScan={onPressManualScan}
          setIsUrlDialogOpen={setIsUrlDialogOpen}
        />

        {/* Fix Bug 15 UI/UX: Hiển thị màng bọc mờ chặn màn hình (Dimming Overlay) khi đang phân tích ảnh nặng, giúp UI rành mạch và tránh người dùng spam nút */}
        {isProcessing && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]} pointerEvents="auto">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: 'white', marginTop: 10, fontWeight: 'bold' }}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Chuỗi kết quả - Ký tự điền từ phải qua trái */}
      <View style={styles.historyTextContainer}>
        {sessionHistory.length === 0 ? (
           <Text style={{ color: 'gray', fontStyle: 'italic', textAlign: 'center' }}>{t('detection.noResultsYet')}</Text>
        ) : (
          <Text 
            style={styles.historyTextContent} 
            numberOfLines={1} 
            ellipsizeMode="head"
          >
            {[...sessionHistory].reverse().map((item, index) => {
              const conf = item.conf || 0;
              let color = '#F44336'; // Đỏ (<60%)
              if (conf > 0.80) color = '#4CAF50'; // Xanh lá (>80%)
              else if (conf > 0.60) color = '#FF9800'; // Vàng (>60%)
              return (
                <Text key={item.id} style={{ color: color, fontWeight: 'bold' }}>
                  {item.sign}{' '}
                </Text>
              );
            })}
          </Text>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        <Button
          mode="contained-tonal"
          icon={() => <HistoryIcon color={theme.colors.primary} size={20} />}
          onPress={() => setIsHistoryDialogOpen(true)}
          style={styles.actionBtn}
        >
          {t('detection.results')}
        </Button>
        <Button
          mode="contained-tonal"
          icon={() => <ListTodo color={theme.colors.primary} size={20} />}
          onPress={() => setIsDebugDialogOpen(true)}
          style={styles.actionBtn}
        >
          {t('detection.queue')}
        </Button>
      </View>

      <DetectionDialogs
        theme={theme}
        isHistoryDialogOpen={isHistoryDialogOpen}
        setIsHistoryDialogOpen={setIsHistoryDialogOpen}
        history={sessionHistory}
        onSaveSession={onSaveSession}
        onSaveMediaSession={onSaveMediaSession}
        setSessionHistory={setSessionHistory}
        detectionMode={detectionMode}
        isDebugDialogOpen={isDebugDialogOpen}
        setIsDebugDialogOpen={setIsDebugDialogOpen}
        debugData={debugData}
        snackbarMsg={snackbarMsg}
        setSnackbarMsg={setSnackbarMsg}
        isUrlDialogOpen={isUrlDialogOpen}
        setIsUrlDialogOpen={setIsUrlDialogOpen}
        handleUrlImage={handleUrlImage}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        clearQueue={clearQueue}
        selectedMedia={selectedMedia}
        isConfirmImageDialogOpen={isConfirmImageDialogOpen}
        setIsConfirmImageDialogOpen={setIsConfirmImageDialogOpen}
        confirmImageAnalysis={confirmImageAnalysis}
        imageToAnalyze={imageToAnalyze}
        imageToAnalyzeSize={imageToAnalyzeSize}
        activePackName={activePack?.name}
        modelInputShape={modelShape}
        batchResults={batchResults}
        isBatchResultDialogOpen={isBatchResultDialogOpen}
        setIsBatchResultDialogOpen={setIsBatchResultDialogOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  mediaContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  topResultOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 30,
    elevation: 30,
  },
  historyTextContainer: {
    height: 60,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  historyTextContent: {
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'right', // Ép chữ dồn sang phải để luôn thấy chữ mới nhất
  },
  // Auto Mode styles
  autoResultOverlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
    elevation: 30,
  },
  autoResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  autoResultText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  autoResultConf: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
