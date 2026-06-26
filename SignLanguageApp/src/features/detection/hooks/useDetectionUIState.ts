import { useState } from 'react';

export function useDetectionUIState() {
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isConfirmImageDialogOpen, setIsConfirmImageDialogOpen] = useState(false);
  const [imageToAnalyze, setImageToAnalyze] = useState<string | null>(null);
  const [imageToAnalyzeSize, setImageToAnalyzeSize] = useState({ width: 0, height: 0, bytes: 0 });
  
  const [detectionMode, setDetectionMode] = useState<'live' | 'picture' | 'video' | 'batch' | 'auto'>('live');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [batchResults, setBatchResults] = useState<{fileName: string, sign: string, conf: number}[]>([]);
  const [isBatchResultDialogOpen, setIsBatchResultDialogOpen] = useState(false);
  const [selectedBatchAssets, setSelectedBatchAssets] = useState<any[]>([]);
  
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);

  return {
    isDebugDialogOpen, setIsDebugDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    isConfirmImageDialogOpen, setIsConfirmImageDialogOpen,
    imageToAnalyze, setImageToAnalyze,
    imageToAnalyzeSize, setImageToAnalyzeSize,
    detectionMode, setDetectionMode,
    isLiveScanning, setIsLiveScanning,
    selectedMedia, setSelectedMedia,
    isProcessing, setIsProcessing,
    batchResults, setBatchResults,
    isBatchResultDialogOpen, setIsBatchResultDialogOpen,
    selectedBatchAssets, setSelectedBatchAssets,
    snackbarMsg, setSnackbarMsg,
    isUrlDialogOpen, setIsUrlDialogOpen,
    urlInput, setUrlInput,
    detectedWord, setDetectedWord,
    confidence, setConfidence
  };
}
