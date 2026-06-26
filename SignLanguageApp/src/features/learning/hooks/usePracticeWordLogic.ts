import { useState, useEffect, useCallback, useRef } from 'react';
import { useLearningStore } from '../store/useLearningStore';
import { triggerSuccessFeedback, triggerErrorFeedback } from '../../../utils/feedback';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import { useTranslation } from 'react-i18next';

export function usePracticeWordLogic(packId: string, filterType: string, wordCount: number, cameraRef: any) {
  const { t } = useTranslation();
  const words = useLearningStore(state => state.packWords[packId]) || [];
  
  const [practiceWords, setPracticeWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState<"green" | "red">("green");
  const [isFinished, setIsFinished] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  const latestDetection = useRef<{wordStr: string, conf: number} | null>(null);

  useEffect(() => {
    // Lọc từ
    let filtered = words;
    switch (filterType) {
      case 'learned': filtered = words.filter(w => w.learned); break;
      case 'unlearned': filtered = words.filter(w => !w.learned); break;
      case 'favorite': filtered = words.filter(w => w.favorite); break;
      case 'unfavorited': filtered = words.filter(w => !w.favorite); break;
    }
    
    // Xáo trộn mảng ngẫu nhiên (Fisher-Yates shuffle)
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Cắt theo số lượng đã chọn
    setPracticeWords(shuffled.slice(0, wordCount));
  }, [words, filterType, wordCount]);

  const currentWord = practiceWords[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < practiceWords.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, practiceWords.length]);

  const handleDetection = useCallback((index: number, conf: number) => {
    if (!currentWord) return;
    const detectedWordStr = words[index]?.word;
    latestDetection.current = { wordStr: detectedWordStr, conf };
  }, [currentWord, words]);

  const { isModelReady, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, undefined, packId);

  const evaluateDetection = useCallback(() => {
    if (!currentWord) return;
    const det = latestDetection.current;
    
    // Ngưỡng 0.6 cho practice
    if (det && det.wordStr === currentWord.word && det.conf >= 0.6) {
      setSnackbarColor("green");
      setSnackbarMsg(t('learning.correctFeedback', { confidence: Math.round(det.conf * 100) }));
      triggerSuccessFeedback();
      setTimeout(handleNext, 1000);
    } else {
      setSnackbarColor("red");
      setSnackbarMsg(t('learning.incorrectFeedbackNoDetect', { word: det?.wordStr || 'Unknown' }));
      triggerErrorFeedback();
    }
  }, [currentWord, handleNext]);

  const checkFromCamera = async () => {
    if (!cameraRef.current || !isModelReady || isProcessing) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 85 });
      let imagePath = photo?.path || photo?.uri || (typeof photo === 'string' ? photo : undefined);
      
      if (imagePath && !imagePath.startsWith('file://') && !imagePath.startsWith('http') && imagePath.startsWith('/')) {
        imagePath = `file://${imagePath}`;
      }

      if (imagePath) {
        latestDetection.current = null;
        clearQueue();
        runDetection(imagePath, facing, true);
        
        let attempts = 0;
        while ((getDebugInfo().isProcessing || getDebugInfo().queueLength > 0) && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        await new Promise(r => setTimeout(r, 100));
        evaluateDetection();
      }
    } catch (e) {
      console.warn("Camera check failed", e);
      setSnackbarColor("red");
      setSnackbarMsg(t('learning.cameraCaptureFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    practiceWords,
    currentIndex,
    currentWord,
    isFinished,
    isProcessing,
    snackbarMsg,
    setSnackbarMsg,
    snackbarColor,
    isModelReady,
    checkFromCamera,
    handleSkip: handleNext,
    facing,
    setFacing
  };
}
