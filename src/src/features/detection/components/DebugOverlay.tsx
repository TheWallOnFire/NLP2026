import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface DebugOverlayProps {
  debugData: {
    queueLength: number;
    isProcessing: boolean;
    processingItem: string | null;
    queue: any[];
    metrics?: {
      preprocessTime: number;
      inferenceTime: number;
      totalTime: number;
      fps: number;
      top3: { idx: number; val: number }[];
    };
  } | null;
  activePackWords: string[];
}

export default function DebugOverlay({ debugData, activePackWords }: DebugOverlayProps) {
  if (!debugData || !debugData.metrics) return null;

  const { queueLength, isProcessing, metrics } = debugData;
  const { preprocessTime, inferenceTime, totalTime, fps, top3 } = metrics;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text allowFontScaling={false} style={styles.header}>Developer Debug Mode</Text>
      
      <View style={styles.row}>
        <Text allowFontScaling={false} style={styles.label}>FPS:</Text>
        <Text allowFontScaling={false} style={[styles.value, { color: fps > 10 ? '#4CAF50' : '#FF9800' }]}>{fps}</Text>
      </View>
      
      <View style={styles.row}>
        <Text allowFontScaling={false} style={styles.label}>Total Time:</Text>
        <Text allowFontScaling={false} style={styles.value}>{totalTime} ms</Text>
      </View>

      <View style={styles.row}>
        <Text allowFontScaling={false} style={styles.label}>- Preprocess:</Text>
        <Text allowFontScaling={false} style={styles.value}>{preprocessTime} ms</Text>
      </View>
      
      <View style={styles.row}>
        <Text allowFontScaling={false} style={styles.label}>- Inference:</Text>
        <Text allowFontScaling={false} style={styles.value}>{inferenceTime} ms</Text>
      </View>

      <View style={[styles.row, { marginTop: 4 }]}>
        <Text allowFontScaling={false} style={styles.label}>Queue:</Text>
        <Text allowFontScaling={false} style={styles.value}>{queueLength} {isProcessing ? '(Processing)' : '(Idle)'}</Text>
      </View>

      {top3 && top3.length > 0 && (
        <View style={styles.top3Container}>
          <Text allowFontScaling={false} style={styles.top3Header}>Top 3 Predictions:</Text>
          {top3.map((pred, i) => {
            const word = activePackWords[pred.idx] || `Class ${pred.idx}`;
            return (
              <View key={i} style={styles.top3Row}>
                <Text allowFontScaling={false} style={styles.top3Word}>{word}</Text>
                <Text allowFontScaling={false} style={styles.top3Prob}>{(pred.val * 100).toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    minWidth: 160,
  },
  header: {
    color: '#00FFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    color: '#BBBBBB',
    fontSize: 11,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  top3Container: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 4,
  },
  top3Header: {
    color: '#FFA500',
    fontSize: 11,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  top3Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  top3Word: {
    color: '#DDDDDD',
    fontSize: 10,
  },
  top3Prob: {
    color: '#00FF00',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
