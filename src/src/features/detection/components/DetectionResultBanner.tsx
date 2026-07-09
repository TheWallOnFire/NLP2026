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
  // Màu sắc cảnh báo dựa trên độ tin cậy
  let colorTheme = { main: '#F44336', bg: '#FFEBEE', text: '#C62828' }; // Đỏ
  if (confidence > 0.90) {
    colorTheme = { main: '#4CAF50', bg: '#E8F5E9', text: '#2E7D32' }; // Xanh lá
  } else if (confidence > 0.60) {
    colorTheme = { main: '#FF9800', bg: '#FFF3E0', text: '#E65100' }; // Vàng
  }
  
  // Bỏ chặn 50% để có thể nhìn thấy chữ màu đỏ (như yêu cầu)
  const displayWord = detectedWord;

  return (
    <View style={styles.resultBannerWrapper}>
      <Card style={styles.resultCard}>
        <View style={styles.resultContent}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text 
              variant="headlineMedium" 
              style={{ fontWeight: '900', color: displayWord ? colorTheme.main : theme.colors.primary }}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
              ellipsizeMode="tail"
            >
              {activePack ? (displayWord || '---') : 'Idle'}
            </Text>
          </View>
          {activePack && displayWord && (
            <View style={[styles.confidenceCircle, { borderColor: colorTheme.main, backgroundColor: colorTheme.bg }]}>
              <Text style={[styles.confidenceText, { color: colorTheme.text }]}>{Math.round(confidence * 100)}</Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  resultBannerWrapper: {
    paddingTop: 10,
    alignItems: 'center', // Đưa name tag ra giữa
  },
  resultCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)', // Nền đen trong suốt cho ngầu
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    width: '40%', // Thu nhỏ 1/3 như yêu cầu (40% cho an toàn không bị tràn)
    minWidth: 120,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confidenceCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginLeft: 8,
  },
  confidenceText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2E7D32',
  },
});
