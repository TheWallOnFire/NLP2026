import { useState, useEffect, useCallback, useRef } from 'react';
import { useLearningStore } from '../store/useLearningStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import { useModelStore } from '../store/useModelStore';
import { triggerSuccessFeedback, triggerErrorFeedback } from '../../../utils/feedback';
import { useSignLanguageModel } from '../../detection/hooks/useSignLanguageModel';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function useTestLogic(packId: string, duration: number, mode: string, cameraRef: any) {
  const words = useLearningStore(state => state.packWords[packId]) || [];
  const addHistoryItem = useHistoryStore(state => state.addHistoryItem);
  const packs = useModelStore(state => state.packs);
  const pack = packs.find(p => p.id === packId);
  const thresholdValue = useSettingsStore(state => state.detection?.threshold || 0.5);

  const [timeLeft, setTimeLeft] = useState(duration || 60);
  const [score, setScore] = useState(0);
  const [testResults, setTestResults] = useState<{ word: string, isCorrect: boolean, correctness?: number, confusedWith?: string }[]>([]);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [testActive, setTestActive] = useState(false);
  
  // Warm-up Timer
  const [warmupTime, setWarmupTime] = useState(3);
  const isMounted = useRef(true);

  // Time Drift fix
  const testEndTimeRef = useRef<number | null>(null);

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState<"green" | "red">("green");

  const latestDetection = useRef<{wordStr: string, conf: number} | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (words.length > 0 && !currentWord && warmupTime === 0) {
      setCurrentWord(words[Math.floor(Math.random() * words.length)]);
      setTestActive(true);
      testEndTimeRef.current = Date.now() + (duration || 60) * 1000;
    }
  }, [words, currentWord, warmupTime, duration]);

  // Warm-up interval
  useEffect(() => {
    if (warmupTime > 0) {
      const timer = setTimeout(() => {
         if (isMounted.current) setWarmupTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [warmupTime]);

  // Main Test Timer (chống drift)
  useEffect(() => {
    if (testActive && testEndTimeRef.current) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((testEndTimeRef.current! - Date.now()) / 1000));
        if (isMounted.current) setTimeLeft(remaining);
      }, 500);
      return () => clearInterval(timer);
    }
  }, [testActive]);

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
    if (words.length <= 1) {
      if (words.length === 1) setCurrentWord(words[0]);
      return;
    }
    let randomWord;
    let fallbackCounter = 0;
    do {
      randomWord = words[Math.floor(Math.random() * words.length)];
      fallbackCounter++;
    } while (currentWord && randomWord.id === currentWord.id && fallbackCounter < 10);
    setCurrentWord(randomWord);
  };

  const handleSimulateCorrect = useCallback(() => {
    if (!testActive || !currentWord || isProcessing) return;
    triggerSuccessFeedback();
    setScore(prev => prev + 1);
    setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: true }]);
    nextWord();
  }, [testActive, currentWord, isProcessing]);

  const handleSimulateSkip = () => {
    if (!testActive || !currentWord || isProcessing) return;
    triggerErrorFeedback();
    setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: false }]);
    nextWord();
  };

  const handleDetection = useCallback((index: number, conf: number) => {
    if (!testActive || !currentWord) return;
    const detectedWordStr = words[index]?.word;
    latestDetection.current = { wordStr: detectedWordStr, conf };
  }, [testActive, currentWord, words]);

  const { isModelReady, runDetection, getDebugInfo, clearQueue } = useSignLanguageModel(handleDetection, undefined, packId);

  const evaluateDetection = useCallback(() => {
    if (!currentWord || !isMounted.current) return;
    const det = latestDetection.current;
    
    if (det && det.wordStr === currentWord.word && det.conf >= thresholdValue) {
      setSnackbarColor("green");
      setSnackbarMsg(`Chính xác! (${Math.round(det.conf * 100)}%)`);
      triggerSuccessFeedback();
      setScore(prev => prev + 1);
      setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: true, correctness: Math.round(det.conf * 100) }]);
      setTimeout(() => {
        if (isMounted.current) nextWord();
      }, 500);
    } else {
      setSnackbarColor("red");
      setSnackbarMsg(`Chưa chính xác! (${det?.wordStr || 'Không rõ'})`);
      triggerErrorFeedback();
      setTestResults(prev => [...prev, { word: currentWord.word, isCorrect: false, correctness: Math.round((det?.conf || 0) * 100), confusedWith: det?.wordStr }]);
      setTimeout(() => {
        if (isMounted.current) nextWord();
      }, 500);
    }
  }, [currentWord, thresholdValue]);

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
    warmupTime,
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
