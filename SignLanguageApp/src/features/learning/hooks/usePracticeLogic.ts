import { useState, useEffect, useCallback, useRef } from 'react';
import { useLearningStore } from '../store/useLearningStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { triggerSuccessFeedback } from '../../../utils/feedback';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import * as ImagePicker from 'expo-image-picker';

export function usePracticeLogic(packId: string, wordId: string | undefined, cameraRef: any) {
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const markLearned = useLearningStore(state => state.markLearned);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceWords, setPracticeWords] = useState<any[]>([]);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState<"default" | "green" | "red">("default");
  
  const thresholdValue = useSettingsStore(state => state.detection?.threshold || 0.5);
  const latestDetection = useRef<{wordStr: string, conf: number} | null>(null);

  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    if (words.length > 0 && practiceWords.length === 0) {
      let sorted;
      if (wordId) {
        const specificWord = words.find(w => w.id === wordId);
        const others = words.filter(w => w.id !== wordId);
        sorted = specificWord ? [specificWord, ...others] : others;
      } else {
        sorted = words.filter(w => !w.learned).concat(words.filter(w => w.learned));
      }
      setPracticeWords(sorted);
    }
  }, [words, practiceWords.length, wordId]);

  const currentWord = practiceWords[currentIndex];

  const handleSkip = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % practiceWords.length);
  }, [practiceWords.length]);

  const evaluateDetection = useCallback(() => {
    if (!currentWord) return;
    const det = latestDetection.current;
    
    if (det && det.wordStr === currentWord.word && det.conf >= thresholdValue) {
      setSnackbarColor("green");
      setSnackbarMsg(`Chính xác! (${Math.round(det.conf * 100)}%)`);
      triggerSuccessFeedback();
      markLearned(packId, currentWord.id, true);
      setTimeout(() => {
        handleSkip();
      }, 1000);
    } else {
      setSnackbarColor("red");
      setSnackbarMsg(`Chưa chính xác! Nhận diện được: ${det?.wordStr || 'Không rõ'} (${Math.round((det?.conf || 0) * 100)}%)`);
    }
  }, [currentWord, thresholdValue, packId, markLearned, handleSkip]);

  const handleDetection = useCallback((index: number, conf: number) => {
    if (!currentWord) return;
    const detectedWordStr = words[index]?.word;
    latestDetection.current = { wordStr: detectedWordStr, conf };
  }, [currentWord, words]);

  const { isModelReady, runDetection, getDebugInfo, clearQueue, modelShape } = useSignLanguageModel(handleDetection);

  const [isConfirmImageDialogOpen, setIsConfirmImageDialogOpen] = useState(false);
  const [imageToAnalyze, setImageToAnalyze] = useState<string | null>(null);
  const [imageToAnalyzeSize, setImageToAnalyzeSize] = useState({ width: 0, height: 0, bytes: 0 });

  const confirmImageAnalysis = async () => {
    setIsConfirmImageDialogOpen(false);
    if (!imageToAnalyze) return;
    setIsProcessing(true);
    latestDetection.current = null;
    clearQueue();
    runDetection(imageToAnalyze, facing, true);
    
    let attempts = 0;
    while ((getDebugInfo().isProcessing || getDebugInfo().queueLength > 0) && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    await new Promise(r => setTimeout(r, 100));
    evaluateDetection();
    setIsProcessing(false);
  };

  const handleImageSelected = async (imagePath: string) => {
    try {
      const FileSystem = require('expo-file-system/legacy');
      const Image = require('react-native').Image;
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      Image.getSize(imagePath, (width: number, height: number) => {
        setImageToAnalyzeSize({ width, height, bytes: fileInfo.size || 0 });
        setImageToAnalyze(imagePath);
        setIsConfirmImageDialogOpen(true);
      }, () => {
        setImageToAnalyzeSize({ width: 0, height: 0, bytes: fileInfo.size || 0 });
        setImageToAnalyze(imagePath);
        setIsConfirmImageDialogOpen(true);
      });
    } catch (e) {
      setImageToAnalyzeSize({ width: 0, height: 0, bytes: 0 });
      setImageToAnalyze(imagePath);
      setIsConfirmImageDialogOpen(true);
    }
  };

  const checkFromCamera = async () => {
    if (!cameraRef.current || !isModelReady) return;
    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 85 });
      let imagePath = photo?.path || (typeof photo.saveToTemporaryFileAsync === 'function' && await photo.saveToTemporaryFileAsync('jpg', 85)) || photo?.uri || (typeof photo === 'string' ? photo : undefined);
      
      if (imagePath && !imagePath.startsWith('file://') && !imagePath.startsWith('http') && imagePath.startsWith('/')) {
        imagePath = `file://${imagePath}`;
      }

      if (imagePath) {
        await handleImageSelected(imagePath);
      }
    } catch (e) {
      console.warn("Camera snapshot failed", e);
      setSnackbarColor("red");
      setSnackbarMsg("Không thể chụp ảnh từ Camera!");
    }
  };

  useEffect(() => {
    const devMode = useSettingsStore.getState().developerDebugMode;
    if (devMode) {
      const interval = setInterval(() => {
        setDebugData(getDebugInfo());
      }, 500);
      return () => clearInterval(interval);
    }
  }, [getDebugInfo]);

  const pickImageForDetection = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const sourceUri = result.assets[0].uri;
        await handleImageSelected(sourceUri);
      }
    } catch (e) {
      console.warn("Failed to pick image", e);
    }
  };

  return {
    practiceWords,
    currentIndex,
    currentWord,
    facing,
    setFacing,
    isProcessing,
    snackbarMsg,
    setSnackbarMsg,
    snackbarColor,
    isDebugDialogOpen,
    setIsDebugDialogOpen,
    debugData,
    setDebugData,
    isModelReady,
    getDebugInfo,
    handleSkip,
    checkFromCamera,
    pickImageForDetection,
    isConfirmImageDialogOpen,
    setIsConfirmImageDialogOpen,
    imageToAnalyze,
    imageToAnalyzeSize,
    confirmImageAnalysis,
    modelShape
  };
}
