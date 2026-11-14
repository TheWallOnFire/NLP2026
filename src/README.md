# Sign Language Detector — Mobile Application

A high-performance, on-device mobile application built with **React Native** and **Expo** for real-time American Sign Language (ASL) detection, interactive learning, and testing.

---

## 🌟 Key Features

- **Real-Time On-Device AI Vision:**
  - Powered by **`react-native-vision-camera`** (v5) and **`react-native-fast-tflite`** (v3) running natively via C++ Nitro Modules.
  - Zero-latency, 100% offline edge processing (no cloud servers, maximum user privacy).
- **Intelligent Dual-Loop Auto Detection:**
  - **Loop 1 (Tracking):** Full-screen hand localization with **MediaPipe Palm Detection SSD** (192x192, 2016 anchors) combined with an adaptive **CamShift** skin-hue tracker.
  - **Loop 2 (Recognition):** Square-cropped hand gesture classification via **MobileNetV2** (224x224 / 96x96, 29 ASL classes).
  - **Spring Physics UI:** Bounding box rendered on the UI Thread using **React Native Reanimated** SharedValues (`withSpring`) for instantaneous visual feedback.
- **Dynamic Model Packs:**
  - Load custom `.zip` model packs on the fly without recompiling the app.
  - Automatic extraction into isolated sandboxes (`packs/{id}/`) and complete clean-wiping on deletion.
- **Learning & Flashcards:**
  - Interactive 3D flip flashcards for vocabulary practice.
  - Camera verification mode with instant accuracy scoring.
  - Word tracking: Learned state, Favorites, and progress percentages.
- **Gamified Test Suite:**
  - **Time Attack:** Sign as many random signs as possible before time expires.
  - **Fixed Sprint:** Race to complete a preset sequence of words (e.g. 10 or 20).
  - Detailed post-test summaries with accuracy percentages and session logs.
- **Multimodal Feedback:**
  - Text-to-Speech (TTS) audio narration via **`expo-speech`**.
  - Tactile vibrations via **`expo-haptics`**.
  - Dual-language support (**English** & **Vietnamese**) via **`react-i18next`**.
  - Adaptive Material Design 3 theming (Light / Dark / System) via **React Native Paper**.

---

## 🏗️ Project Architecture

```text
src/
├── assets/                     # App icons, splash screens, and default models
│   └── models/
│       └── palm_detection.tflite # Bundled MediaPipe palm detection model
├── src/                        # Modular application source code
│   ├── components/             # App-wide UI components (ErrorBoundary, etc.)
│   ├── constants/              # Navigation route names and global constants
│   ├── core/                   # i18n localization resources (en, vi)
│   ├── features/               # Feature-based domain modules
│   │   ├── common/             # Splash / Loading screens
│   │   ├── dashboard/          # Home dashboard, streak tracking & stats
│   │   ├── detection/          # Live camera, auto-mode tracking, TFLite inference
│   │   ├── history/            # Session logs and timeline viewer
│   │   ├── learning/           # Model packs, flashcards, practice & test modes
│   │   ├── profile/            # User profile and statistics
│   │   └── settings/           # App settings, cache cleaner & model manager
│   ├── navigation/             # Bottom tab & stack navigators
│   ├── theme/                  # Material Design 3 theme configurations
│   └── utils/                  # Feedback (haptics/sounds) and ZIP pack importer
├── app.json                    # Expo application configuration & plugins
├── App.tsx                     # Application entry point
├── eas.json                    # EAS Build configuration
├── metro.config.js             # Metro bundler config (.tflite asset support)
└── package.json                # Project dependencies and build scripts
```

---

## 🛠️ Build & Development Instructions

Because this app utilizes native C++ libraries (`react-native-fast-tflite`, `react-native-vision-camera`, `react-native-nitro-modules`), it requires an **Expo Development Client** build or **EAS Build** rather than standard Expo Go.

### Prerequisites

| Tool | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | 18+ or 20+ LTS | JavaScript / TypeScript runtime |
| **npm** | 9+ | Package manager |
| **Android Studio** | Latest | Android SDK & NDK for local native builds |
| **EAS CLI** | Latest (`npm install -g eas-cli`) | Cloud builds via Expo Application Services |

### Installation

```bash
# Navigate to the mobile app directory
cd src

# Install dependencies
npm install
```

### Running with Expo Prebuild (Local Native Development)

1. **Generate native Android/iOS directories:**
   ```bash
   npx expo prebuild --clean
   ```

2. **Start the Metro development server:**
   ```bash
   npx expo start -c
   ```

3. **Build and launch on a connected device or emulator:**
   ```bash
   # For Android:
   npx expo run:android

   # For iOS (macOS only):
   npx expo run:ios
   ```

### Building a Production APK / AAB (via EAS Build)

```bash
# Build standalone Android APK for physical device testing
eas build --platform android --profile preview
```

---

## 📦 Model Pack Specification

A Model Pack is an isolated `.zip` archive structured as follows:

```text
pack_name.zip
├── assets/
│   ├── model.tflite               # TensorFlow Lite model file
│   ├── metadata.json              # Pack ID, name, version, input_shape, normalization
│   └── vocabulary/
│       ├── word_list.json         # Mapping of class index to label string
│       └── word_images/           # (Optional) PNG demonstration images
└── README.md                      # Documentation for the pack
```

Model packs can be generated using `python models/generator.py` and imported into the app from **Settings > Model Manager > Import Custom Pack**.
