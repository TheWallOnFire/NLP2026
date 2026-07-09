import React from 'react';
import { View, Image } from 'react-native';
import { Dialog, Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface ConfirmImageDialogProps {
  theme: any;
  isVisible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  imageUri: string | null;
  imageSize: { width: number; height: number; bytes: number };
  activePackName: string;
  modelInputShape: number[];
}

export default function ConfirmImageDialog({
  theme,
  isVisible,
  onDismiss,
  onConfirm,
  imageUri,
  imageSize,
  activePackName,
  modelInputShape
}: ConfirmImageDialogProps) {
  const { t } = useTranslation();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const targetWidth = modelInputShape[1] || 224;
  const targetHeight = modelInputShape[2] || 224;
  
  // Estimate time (average ~350ms, plus dynamic scaling based on resolution if very large)
  let estimatedTime = 350;
  if (imageSize.width > 2000 || imageSize.height > 2000) estimatedTime += 200;
  if (imageSize.bytes > 5 * 1024 * 1024) estimatedTime += 300; // > 5MB

  return (
    <Dialog visible={isVisible} onDismiss={onDismiss} style={{ maxHeight: '80%', borderRadius: 28, backgroundColor: theme.colors.elevation.level3 }}>
      <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold' }}>
        Confirm Image?
      </Dialog.Title>
      <Dialog.Content>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {imageUri && (
            <View style={{ width: 200, height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: '#333' }}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}
          
          <View style={{ width: '100%', backgroundColor: theme.colors.elevation.level2, padding: 16, borderRadius: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ opacity: 0.7 }}>Model:</Text>
              <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{activePackName || 'Default Model'}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ opacity: 0.7 }}>Image Size:</Text>
              <Text style={{ fontWeight: '500' }}>
                {imageSize.width > 0 ? `${imageSize.width}x${imageSize.height} (${formatBytes(imageSize.bytes)})` : formatBytes(imageSize.bytes)}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ opacity: 0.7 }}>Target Size:</Text>
              <Text style={{ fontWeight: '500' }}>{targetWidth}x{targetHeight}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ opacity: 0.7 }}>Time Process:</Text>
              <Text style={{ fontWeight: '500' }}>~{estimatedTime}ms</Text>
            </View>
          </View>
        </View>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.error}>
          Cancel
        </Button>
        <Button mode="contained" onPress={onConfirm}>
          Confirm
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
