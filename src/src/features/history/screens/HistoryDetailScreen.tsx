import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Badge, IconButton, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, BookOpen, CheckSquare, Image as ImageIcon, Video as VideoIcon, CheckCircle2, XCircle } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useHistoryStore } from '../store/useHistoryStore';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';

export default function HistoryDetailScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { historyId } = route.params || {};
  const { t } = useTranslation();

  const historyItem = useHistoryStore((state) => 
    state.history.find(h => h.id === historyId)
  );

  const [mediaExists, setMediaExists] = React.useState(true);

  React.useEffect(() => {
    const checkMedia = async () => {
      if (historyItem?.imageUri || historyItem?.videoUri) {
        try {
          const uri = historyItem.imageUri || historyItem.videoUri;
          if (uri && uri.startsWith('file://')) {
            const info = await FileSystem.getInfoAsync(uri);
            setMediaExists(info.exists);
          } else {
            setMediaExists(true);
          }
        } catch {
          setMediaExists(false);
        }
      }
    };
    checkMedia();
  }, [historyItem]);

  if (!historyItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="titleLarge">{t('history.noDataFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const signs = historyItem.signs || (historyItem.sign ? [historyItem.sign] : []);

  const getSessionTypeInfo = (type: string, mode?: string) => {
    if (type === 'test') {
      return { title: 'Bài kiểm tra', icon: <CheckSquare size={24} color={theme.colors.error} /> };
    }
    if (type === 'learning') {
      return { title: 'Học tập', icon: <BookOpen size={24} color={theme.colors.secondary} /> };
    }
    if (type === 'detection') {
      if (mode === 'live') return { title: 'Camera', icon: <Camera size={24} color={theme.colors.primary} /> };
      if (mode === 'picture') return { title: 'Image', icon: <ImageIcon size={24} color={theme.colors.primary} /> };
      if (mode === 'video') return { title: 'Video', icon: <VideoIcon size={24} color={theme.colors.primary} /> };
      if (mode === 'batch') return { title: 'Batch Scan', icon: <ImageIcon size={24} color={theme.colors.primary} /> };
      return { title: 'Phiên nhận diện', icon: <Camera size={24} color={theme.colors.primary} /> };
    }
    return { title: 'Phiên hoạt động', icon: <BookOpen size={24} color={theme.colors.primary} /> };
  };

  const sessionInfo = getSessionTypeInfo(historyItem.type, historyItem.mode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>{sessionInfo.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.infoCard} mode="elevated">
          <Card.Title 
            title={historyItem.sign} 
            titleStyle={{ fontWeight: 'bold' }}
            left={() => sessionInfo.icon}
          />
          <Card.Content>
            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{t('history.date')}</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{historyItem.date}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{t('history.startTime')}</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{historyItem.time}</Text>
            </View>
            {historyItem.type === 'test' && historyItem.testStats ? (
              <>
                <View style={styles.metricRow}>
                  <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{t('history.scoreDetails')}</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>{historyItem.testStats.score} / {historyItem.testStats.total}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{t('history.accuracy')}</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>{historyItem.testStats.total > 0 ? Math.round((historyItem.testStats.score / historyItem.testStats.total) * 100) : 0}%</Text>
                </View>
              </>
            ) : historyItem.type === 'test' ? (
              <View style={styles.metricRow}>
                <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{t('history.scoreDetails')}</Text>
                <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>{signs.length} / {signs.length}</Text>
              </View>
            ) : (
              <View style={styles.metricRow}>
                <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{t('history.totalWordsDetails')}</Text>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{signs.length}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {historyItem.type === 'test' && historyItem.testStats ? (
          <>
            <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
              Kết quả chi tiết:
            </Text>
            <View style={styles.testResultsContainer}>
              {historyItem.testResults?.map((res, index) => (
                <Card key={index} style={[styles.testResultCard, { borderColor: res.isCorrect ? '#4CAF50' : '#F44336' }]} mode="outlined">
                  <View style={styles.testResultRow}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginRight: 12, opacity: 0.5, width: 24 }}>{index + 1}.</Text>
                    <View style={styles.testResultIcon}>
                      {res.isCorrect ? <CheckCircle2 color="#4CAF50" size={20} /> : <XCircle color="#F44336" size={20} />}
                    </View>
                    <View style={styles.testResultContent}>
                      <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>{res.word}</Text>
                      <Text variant="bodySmall" style={{ color: res.isCorrect ? '#4CAF50' : '#F44336' }}>
                        {res.isCorrect 
                          ? `Đúng (${res.correctness || 0}%)` 
                          : `Sai${res.confusedWith ? ` (Nhầm với: ${res.confusedWith})` : ''}`}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : historyItem.type === 'detection' && historyItem.mode === 'live' ? (
          <>
            <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
              Nội dung nhận diện từ Camera:
            </Text>
            <View style={styles.textEditorContainer}>
              <Text style={styles.textEditorText}>
                {signs.join('\n')}
              </Text>
            </View>
          </>
        ) : historyItem.type === 'detection' && (historyItem.mode === 'picture' || historyItem.mode === 'video') ? (
          <>
             <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
              Kết quả nhận diện:
            </Text>
            <View style={styles.signsContainer}>
              {signs.map((sign, index) => (
                <Badge key={`${sign}-${index}`} size={32} style={[styles.signBadge, { backgroundColor: theme.colors.primary, color: theme.colors.onPrimary }]}>
                  {sign}
                </Badge>
              ))}
            </View>
            <View style={{ padding: 12, alignItems: 'center' }}>
              {mediaExists && (historyItem.imageUri || historyItem.videoUri) ? (
                <Image 
                  source={{ uri: historyItem.imageUri || historyItem.videoUri }} 
                  style={{ width: '100%', height: 250, borderRadius: 8, resizeMode: 'contain' }} 
                />
              ) : (historyItem.imageUri || historyItem.videoUri) ? (
                <View style={{ width: '100%', height: 150, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Text variant="bodyMedium" style={{ opacity: 0.5 }}>{t('history.mediaDeleted')}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : historyItem.type === 'detection' && historyItem.mode === 'batch' && historyItem.batchResults ? (
          <>
            <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
              Kết quả quét thư mục:
            </Text>
            <View style={styles.testResultsContainer}>
              {historyItem.batchResults.map((res, index) => (
                <Card key={index} style={styles.testResultCard} mode="outlined">
                  <View style={styles.testResultRow}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginRight: 12, opacity: 0.5, width: 24 }}>{index + 1}.</Text>
                    <View style={styles.testResultIcon}>
                      <ImageIcon color={theme.colors.primary} size={20} />
                    </View>
                    <View style={styles.testResultContent}>
                      <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>{res.fileName}</Text>
                      <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                        Nhận diện: {res.sign} ({Math.round(res.conf * 100)}%)
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
              Các từ đã nhận diện:
            </Text>
            <View style={styles.signsContainer}>
              {signs.map((sign, index) => (
                <Badge 
                  key={`${sign}-${index}`}
                  size={32}
                  style={[
                    styles.signBadge, 
                    { backgroundColor: theme.colors.primary, color: theme.colors.onPrimary }
                  ]}
                >
                  {sign}
                </Badge>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 8,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 16,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  signsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 8,
  },
  textEditorContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
  },
  textEditorText: {
    color: '#D4D4D4',
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 24,
  },
  testResultsContainer: {
    gap: 8,
  },
  testResultCard: {
    borderWidth: 1,
    borderRadius: 8,
  },
  testResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  testResultIcon: {
    marginRight: 12,
  },
  testResultContent: {
    flex: 1,
  },
  mediaContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  }
});
