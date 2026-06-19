import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

interface DetectionResultBannerProps {
  theme: any;
  activePack: any;
  detectedWord: string | null;
  confidence: number;
}

export default function DetectionResultBanner({
  theme,
  activePack,
  detectedWord,
  confidence
}: DetectionResultBannerProps) {
  return (
    <View style={styles.resultBannerWrapper}>
      <Card style={styles.resultCard}>
        <View style={styles.resultContent}>
          <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={{ color: 'gray', textTransform: 'uppercase' }}>
              {activePack ? 'Live Detection Result' : 'System Idle'}
            </Text>
            <Text variant="displaySmall" style={{ fontWeight: '900', color: theme.colors.primary, marginTop: -4 }}>
              {activePack ? (detectedWord || '---') : 'Select Model'}
            </Text>
          </View>
          {activePack && detectedWord && (
            <View style={styles.confidenceCircle}>
              <Text style={styles.confidenceText}>{Math.round(confidence * 100)}%</Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  resultBannerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  resultCard: {
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  confidenceCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  confidenceText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#2E7D32',
  },
});
