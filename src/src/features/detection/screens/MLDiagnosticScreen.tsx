import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Appbar, Text, Button, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { prepareImageForModel, convertPixelsToInputData } from '../utils/imageProcessor';
import { parseInferenceOutput } from '../utils/modelOutputParser';
import { useModelStore } from '../../learning/store/useModelStore';
import { useLearningStore } from '../../learning/store/useLearningStore';
import i18n from '../../../core/i18n';

export default function MLDiagnosticScreen({ navigation }: any) {
  const theme = useTheme();
  const { customModelUri, activePackId, packs } = useModelStore();
  const activePack = packs.find(p => p.id === activePackId);
  const { packWords } = useLearningStore();
  
  const [testImageUri, setTestImageUri] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [model, setModel] = useState<any>(null);

  // Load Model
  useEffect(() => {
    const loadModel = async () => {
      let urlToLoad = customModelUri || (activePackId ? `${FileSystem.documentDirectory}packs/${activePackId}/model.tflite` : null);
      if (!urlToLoad) return;
      try {
        let m;
        if (Platform.OS === 'ios') {
          m = await loadTensorflowModel({ url: urlToLoad }, ['core-ml']);
        } else {
          m = await loadTensorflowModel({ url: urlToLoad }, []); // Disable NNAPI
        }
        setModel(m);
      } catch (e) {
        console.error("Diagnostic Model Load Error", e);
      }
    };
    loadModel();
    return () => {
      if (model && typeof model.release === 'function') model.release();
    };
  }, [customModelUri, activePackId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Nguyên bản
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTestImageUri(result.assets[0].uri);
      setResults([]);
    }
  };

  const runDiagnostic = async () => {
    if (!testImageUri || !model) return;
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const words = packWords[activePackId || '']?.map(w => w.word) || [];
    const testResults = [];

    // Loop 100 times sequentially
    for (let i = 1; i <= 100; i++) {
      try {
        setProgress(i);
        // 1. Prepare Image (ImageManipulator -> resize)
        const shape = model.inputs?.[0]?.shape || activePack?.inputShape || [1, 224, 224, 3];
        const dataType = model.inputs?.[0]?.dataType;
        const outDataType = model.outputs?.[0]?.dataType;

        const { uint8Array, expectedElements, isRGBA, expectedChannels, pixelFormat } = await prepareImageForModel(testImageUri, shape, 'back');
        
        // 2. Convert to Float32/Uint8
        const inputData = await convertPixelsToInputData(uint8Array, expectedElements, isRGBA, expectedChannels, dataType, pixelFormat);

        // 3. Inference
        const outputs = model.runSync([inputData.buffer]);

        // 4. Parse
        const result = parseInferenceOutput(outputs, outDataType);

        if (result) {
          const { maxIdx, maxVal, top3 } = result;
          const safeMaxIdx = (maxIdx >= 0 && maxIdx < words.length) ? maxIdx : -1;
          const maxWord = safeMaxIdx !== -1 ? words[safeMaxIdx] : 'Unknown';
          
          const top3Str = top3.map(t => {
            const word = (t.idx >= 0 && t.idx < words.length) ? words[t.idx] : 'Unknown';
            return `${word}(${(t.val * 100).toFixed(1)}%)`;
          }).join(' | ');

          testResults.push({
            run: i,
            maxWord,
            maxVal,
            top3Str,
            hash: top3Str // Dùng top3 làm hash so sánh
          });
        } else {
          testResults.push({ run: i, maxWord: 'ERROR', maxVal: 0, top3Str: 'No output', hash: 'error' });
        }
      } catch (e: any) {
        testResults.push({ run: i, maxWord: 'CRASH', maxVal: 0, top3Str: e.message || String(e), hash: 'crash' });
      }

      // Nhường luồng JS để UI update
      if (i % 5 === 0) {
        setResults([...testResults]);
        await new Promise(r => setTimeout(r, 10));
      }
    }

    setResults([...testResults]);
    setIsRunning(false);

    // Tính toán độ nhất quán
    const uniqueHashes = new Set(testResults.map(r => r.hash));
    if (uniqueHashes.size === 1) {
      Alert.alert(i18n.t('detection.diagnosticResult'), i18n.t('detection.diagnosticStable'));
    } else {
      Alert.alert(i18n.t('detection.diagnosticResult'), i18n.t('detection.diagnosticUnstable', { count: uniqueHashes.size }));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="ML Diagnostic Tool" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Kiểm thử Độ Ổn Định (Determinism)</Text>
          <Text variant="bodySmall" style={{ marginTop: 8, color: 'gray' }}>
            Công cụ này sẽ xử lý 1 ảnh 100 lần để xem model có xuất ra cùng 1 kết quả hay không.
          </Text>
          <Text style={{ marginTop: 8 }}>
            Model hiện tại: {model ? (activePack?.name || 'Custom') : 'Chưa nạp'}
          </Text>
        </Card>

        <View style={styles.row}>
          <Button mode="outlined" onPress={pickImage} disabled={isRunning} style={{ flex: 1, marginRight: 8 }}>
            {testImageUri ? "Đổi Ảnh" : "Chọn Ảnh"}
          </Button>
          <Button mode="contained" onPress={runDiagnostic} disabled={!testImageUri || !model || isRunning} style={{ flex: 1 }}>
            {isRunning ? `Running ${progress}/100` : "Run 100x Test"}
          </Button>
        </View>

        {isRunning && (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 8 }}>Vui lòng đợi (Có thể lag nhẹ)...</Text>
          </View>
        )}

        <ScrollView style={styles.scrollArea}>
          {results.map((r, index) => (
            <View key={index} style={styles.resultRow}>
              <Text style={{ fontWeight: 'bold', width: 40 }}>#{r.run}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{r.maxWord} ({(r.maxVal * 100).toFixed(2)}%)</Text>
                <Text style={{ fontSize: 12, color: 'gray' }}>{r.top3Str}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flex: 1 },
  row: { flexDirection: 'row', marginBottom: 16 },
  scrollArea: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 8 },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center'
  }
});
