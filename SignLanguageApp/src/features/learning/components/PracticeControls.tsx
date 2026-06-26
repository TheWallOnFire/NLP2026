import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { CheckCircle, SkipForward } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface PracticeControlsProps {
  isProcessing: boolean;
  isModelReady: boolean;
  pickImageForDetection: () => void;
  checkFromCamera: () => void;
  handleSkip: () => void;
}

export default function PracticeControls({
  isProcessing,
  isModelReady,
  pickImageForDetection,
  checkFromCamera,
  handleSkip
}: PracticeControlsProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.footer}>
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
        <Button 
          mode="contained-tonal" 
          onPress={pickImageForDetection} 
          style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
          disabled={isProcessing || !isModelReady}
          icon="image"
        >
          {t('learning.photo')}
        </Button>

        <Button 
          mode="contained" 
          onPress={checkFromCamera} 
          style={[styles.actionButton, { flex: 1 }]}
          buttonColor={theme.colors.primary}
          disabled={isProcessing || !isModelReady}
          icon={() => <CheckCircle size={20} color="white" />}
        >
          {t('learning.check')}
        </Button>

        <Button 
          mode="outlined" 
          onPress={handleSkip} 
          style={styles.actionButton}
          icon={() => <SkipForward size={20} color={theme.colors.primary} />}
        >
          {t('learning.next')}
        </Button>
      </View>
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    borderRadius: 16,
    elevation: 2,
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute', 
    top: -50, 
    alignSelf: 'center', 
    backgroundColor: 'white', 
    padding: 8, 
    borderRadius: 20, 
    elevation: 4 
  }
});
