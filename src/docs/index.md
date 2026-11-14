# Mobile App Technical Documentation

Welcome to the internal engineering documentation for the **NLP2026 Sign Language Detector** mobile application.

---

## 📖 Documentation Index

1. **[Architecture & State Management](./architecture.md)**
   - Explains the feature-driven folder hierarchy (`src/src/features/...`), navigation structure, and Zustand global stores.
2. **[Machine Learning Pipeline](./ml-pipeline.md)**
   - Details the real-time on-device dual-loop AI engine: MediaPipe SSD Palm Detection, CamShift skin-color tracking, and MobileNetV2 classification via `react-native-fast-tflite`.
3. **[Camera & Optics Architecture](./camera.md)**
   - Explains how `react-native-vision-camera` coordinates with hardware sensors, handles pixel formats, orientation, and memory lifecycle.
4. **[Comprehensive Feature List](./features.md)**
   - Outlines the complete feature set: Vision detection modes, Model Pack management, interactive learning flashcards, gamified tests, and accessibility options.
5. **[Known Issues & Edge Cases Analysis](./bug.md)**
   - Technical analysis of 30 hardware, ML, and state synchronization edge-cases with mitigation strategies.
6. **[Autonomous Pipeline & Resolution Log](./fix.md)**
   - Detailed architectural breakdown of the Auto Mode implementation, SSD anchor decoding, and memory offset parsing fixes.
