import { useState, useEffect, useCallback, useRef } from 'react';
import { useLearningStore } from '../store/useLearningStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../store/useModelStore';
import { triggerSuccessFeedback, triggerErrorFeedback } from '../../../utils/feedback';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';

export function useTestLogic(packId: string, duration: number, mode: string, cameraRef: any) {
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);
  const packs = useModelStore(state => state.packs);
  const pack = packs.find(p => p.id === packId);

  const [timeLeft, setTimeLeft] = useState(duration || 60);
  const [score, setScore] = useState(0);
  const [testResults, setTestResults] = useState<{ word: string, isCorrect: boolean, correctness?: number, confusedWith?: string }[]>([]);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [testActive, setTestActive] = useState(false);
  
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState<"green" | "red">("green");

  const latestDetection = useRef<{wordStr: string, conf: number} | null>(null);

  useEffect(() => {
    if (words.length > 0 && !currentWord) {
      setCurrentWord(words[Math.floor(Math.random() * words.length)]);
      setTestActive(true);
    }
  }, [words, currentWord]);

  useEffect(() => {
    if (timeLeft > 0 && testActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, testActive]);

  useEffect(() => {
    if (timeLeft === 0 && testActive) {
      setTestActive(false);
      addHistoryItem({
        sign: `Bài kiểm tra: ${pack?.name || 'Gói từ'}`,
        packId,
        mode: 'test',
        date: new Date().toLocaleDateString('vi-VN'),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        type: 'test',
        testStats: {
          score,
          total: testResults.length,
          duration: duration || 60,
        },
        testResults,
      });
    }
  }, [timeLeft, testActive, score, testResults, addHistoryItem, pack, packId, duration]);

  const nextWord = () => {
    if (words.length <= 1) return;
    let randomWord;
    do {
      randomWord = words[Math.floor(Math.random() * words.length)];
    } while (currentWord && randomWord.id === currentWord.id);
    setCurrentWord(randomWord);
  };

  const handleSimulateCorrect = useCallback(() => {
    if (!testActive || !currentWord) return;
    triggerSuccessFeedback();
    setScore(prev => prev + 1);
    setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: true }]);
    nextWord();
  }, [testActive, currentWord]);

  const handleSimulateSkip = () => {
    if (!testActive || !currentWord) return;
    triggerErrorFeedback();
    setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: false }]);
    nextWord();
  };

  const handleDetection = useCallback((index: number, conf: number) => {
    if (!testActive || !currentWord) return;
    const detectedWordStr = words[index]?.word;
    latestDetection.current = { wordStr: detectedWordStr, conf };
  }, [testActive, currentWord, words]);

  const { isModelReady, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection);

  const evaluateDetection = useCallback(() => {
    if (!currentWord) return;
    const det = latestDetection.current;
    
    if (det && det.wordStr === currentWord.word && det.conf >= 0.7) {
      setSnackbarColor("green");
      setSnackbarMsg(`Chính xác! (${Math.round(det.conf * 100)}%)`);
      triggerSuccessFeedback();
      setScore(prev => prev + 1);
      setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: true, correctness: Math.round(det.conf * 100) }]);
      setTimeout(() => {
        nextWord();
      }, 500);
    } else {
      setSnackbarColor("red");
      setSnackbarMsg(`Chưa chính xác! Nhận diện được: ${det?.wordStr || 'Không rõ'} (${Math.round((det?.conf || 0) * 100)}%)`);
      triggerErrorFeedback();
      setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: false, correctness: Math.round((det?.conf || 0) * 100), confusedWith: det?.wordStr }]);
      setTimeout(() => {
        nextWord();
      }, 500);
    }
  }, [currentWord]);

  const checkFromCamera = async () => {
    if (!cameraRef.current || !isModelReady) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 85 });
      let imagePath = photo?.path || (typeof photo.saveToTemporaryFileAsync === 'function' && await photo.saveToTemporaryFileAsync('jpg', 85)) || photo?.uri || (typeof photo === 'string' ? photo : undefined);
      
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
      console.warn("Camera snapshot failed in test", e);
      setSnackbarColor("red");
      setSnackbarMsg("Không thể chụp ảnh từ Camera!");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    words,
    timeLeft,
    score,
    currentWord,
    testActive,
    facing,
    setFacing,
    isProcessing,
    snackbarMsg,
    setSnackbarMsg,
    snackbarColor,
    isModelReady,
    handleSimulateSkip,
    checkFromCamera
  };
}
