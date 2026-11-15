# 👋 Sign Language Detector App

> **Bridging the communication gap through real-time AI-powered hand sign recognition on mobile devices.**

<div align="left">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black.svg)
![Vision](https://img.shields.io/badge/Vision-VisionCamera%20v5-orange.svg)
![TensorFlow Lite](https://img.shields.io/badge/AI-TensorFlow%20Lite-FF6F00.svg)

</div>

---

## 🌟 Overview

The **Sign Language Detector App** is an offline-first mobile application designed to recognize and interpret American Sign Language (ASL) hand signs in real-time. Powered by a hybrid computer vision pipeline combining **MediaPipe Palm Detection**, **CamShift Adaptive Tracking**, and **MobileNetV2 Classification**, it operates entirely on-device with zero cloud dependencies, ensuring ultra-low latency and user privacy.

---

## 🏗️ Project Structure

```text
NLP2026/
├── .agents/                     # Specialized AI agent skills and runbooks
│   └── skills/                  # Domain runbooks (packaging, evaluation, review, pipeline)
├── configs/                     # Centralized model & system configurations
│   └── models_config.json       # Specifications for trained ASL models
├── data/                        # Dataset acquisition and preprocessing
│   └── download_dataset.py      # Automated dataset downloader (Kaggle ASL Alphabet)
├── doc/                         # Architecture, design specs, and tech stack documentation
│   ├── architecture_and_pipeline.md # Complete architectural and pipeline specification
│   ├── troubleshooting_and_faq.md   # Developer FAQ and common build/runtime troubleshooting
│   ├── design.md                # C4 architecture diagrams and pipeline design
│   ├── proposal.md              # Project proposal, scope, and objectives
│   ├── tech_stack.md            # Detailed technology stack breakdown
│   └── README.md                # Documentation index
├── models/                      # Model training, checkpoints, and packaging
│   ├── model/                   # Serialized model weights (.keras, model.zip)
│   ├── notebook/                # Jupyter research notebooks
│   ├── crop.py                  # Interactive Tkinter image cropper utility
│   ├── generator.py             # Converter from Keras to mobile TFLite Model Packs
│   └── README.md                # Model documentation
├── screenshot/                  # Sample test images and verification captures
├── src/                         # React Native mobile application
│   ├── assets/                  # Bundled assets (icons, splash, palm_detection.tflite)
│   ├── src/                     # Application source code
│   │   ├── components/          # Shared components (ErrorBoundary, etc.)
│   │   ├── constants/           # Route constants and app-wide identifiers
│   │   ├── core/                # i18n localization resources (en, vi)
│   │   ├── features/            # Feature modules (detection, learning, history, etc.)
│   │   ├── navigation/          # React Navigation bottom tabs and stacks
│   │   ├── theme/               # Material Design 3 light & dark themes
│   │   └── utils/               # Audio/haptic feedback & ZIP pack importer
│   ├── app.json                 # Expo application configuration & plugins
│   ├── App.tsx                  # Application entry point
│   └── package.json             # Mobile app dependencies and scripts
├── tests/                       # AI and TFLite model test suite
│   ├── 01_test_keras_dataset.py # Keras model evaluation on dataset
│   ├── 02_test_keras_center_crop.py # Center-crop image inference
│   ├── 03_test_tflite_shapes.py # TFLite tensor inspection
│   ├── 04_test_tflite_dataset.py# TFLite batch dataset evaluation
│   ├── 05_test_tflite_real.py   # TFLite single-image verification
│   ├── 06_eval_quick.py         # Comparative benchmark across models
│   └── test.py                  # Interactive CLI test suite runner
├── requirements.txt             # Python dependencies for AI environment
└── README.md                    # Project documentation
```

---

## 🛠️ Tech Stack

### Mobile Frontend
- **Framework:** [React Native](https://reactnative.dev/) (v0.81) with [Expo SDK 54](https://expo.dev/) (New Architecture & Nitro Modules)
- **Language:** TypeScript 5.9
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) with `@react-native-async-storage/async-storage` for local persistence
- **UI & Design:** [React Native Paper](https://callstack.github.io/react-native-paper/) (Material Design 3), [Lucide React Native](https://lucide.dev/)
- **Animation:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) (Spring physics on UI Thread)
- **Localization:** [react-i18next](https://react.i18next.com/) (English & Vietnamese)

### On-Device AI & Hardware Integration
- **Camera:** `react-native-vision-camera` (v5)
- **Inference Engine:** `react-native-fast-tflite` (v3) with C++ XNNPACK acceleration
- **Memory Sharing:** `react-native-nitro-modules` (Zero-copy ArrayBuffers) & `react-native-nitro-image`
- **Vision Pipeline:**
  - **MediaPipe Palm Detection SSD:** 192x192 Single-Shot Detector (2,016 anchors)
  - **CamShift Tracker:** HSV skin-hue color tracking with continuous adaptive histograms
  - **MobileNetV2 ASL Classifier:** 224x224 input, 29 classes (A–Z, del, nothing, space)
- **Audio & Haptics:** `expo-speech` (Text-to-Speech), `expo-haptics`, `expo-video`

### Python AI Training & Testing
- **Core:** Python 3.8+, TensorFlow 2.x, OpenCV (`cv2`), Scikit-learn
- **Dataset:** Kaggle CLI (`grassknoted/asl-alphabet`)

---

## ✨ Key Features

### 🔍 Vision & Detection
- **Autonomous Tracking (Auto Mode):** The app automatically locates your hand anywhere in the frame using MediaPipe SSD, locks on with CamShift, and tracks it smoothly at 60 FPS using Reanimated Spring Physics.
- **Configurable Cadence:** Fast, Normal (1s), Slow (3s), and Manual Shutter trigger modes.
- **Static & Sequential Processing:** Detect signs from gallery images, camera photos, or sequential video keyframes.
- **Dynamic Model Swapping:** Switch between different AI models and vocabularies during runtime without restarting.

### 📦 Modular Model Packs
- Load custom `.zip` Model Packs directly through the app.
- Extracted into isolated device directories (`packs/{id}/`) with complete clean-wiping on deletion.

### 🎓 Learning & Testing Hub
- **Interactive Flashcards:** 3D flip cards with sign gesture illustrations and audio pronunciation.
- **Practice Verification:** Live camera verification providing instant accuracy scoring.
- **Gamified Test Modes:** **Time Attack** and **Fixed Sprint** with post-test accuracy and error summaries.

### 📜 Activity History & Settings
- Comprehensive session timeline with filtering and sorting.
- Dark, Light, and System themes.
- Built-in **ML Diagnostic Screen** for 100x stability testing.
- One-tap cache cleanup and factory reset.

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js:** v18+ or v20+ LTS
- **Python:** v3.8+
- **Android Studio / Xcode:** For compiling native builds (or use EAS Build for cloud builds)

### 2. Python AI Environment Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# (Optional) Download dataset from Kaggle
python data/download_dataset.py

# Convert Keras models into mobile TFLite Model Packs
python models/generator.py

# Run the interactive AI test suite
python tests/test.py

# Or run the automated headless test suite
python tests/test.py --all
```

### 3. Mobile App Setup (Expo Dev Client)
Because the app relies on native C++ modules (`react-native-fast-tflite`, `react-native-vision-camera`), run it using an **Expo Development Client** or **EAS Build**:

```bash
# Navigate to mobile app directory
cd src

# Install npm dependencies
npm install

# Generate native Android and iOS projects
npx expo prebuild --clean

# Start Metro bundler with clean cache
npx expo start -c

# Run on connected Android device or emulator
npx expo run:android

# Or run on iOS simulator (macOS only)
npx expo run:ios
```

---

## 🛡️ Non-Functional Requirements & Security

- **100% Offline Core:** All detection, learning, and history features operate without an active internet connection.
- **Privacy First:** Camera frames and images remain strictly on the user's device and are never transmitted over the network.
- **No Hardcoded Secrets or Paths:** Dynamic relative paths and environment configurations are used throughout the codebase.
- **Zero Storage Bloat:** Intermediate image manipulation caches are purged automatically on app launch and session transitions.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
