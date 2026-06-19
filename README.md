# 👋 Sign Language Detector App

> **Bridging the communication gap through real-time AI-powered hand sign recognition.**

<div align="left">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![MediaPipe](https://img.shields.io/badge/Vision-MediaPipe-orange.svg)
![React Native](https://img.shields.io/badge/React%20Native-3.8+-green.svg)
![Tensorflow](https://img.shields.io/badge/TensorFlow-Lite-orange.svg)

</div>

## 🌟 Overview

The **Sign Language Detector App** is a powerful offline-first mobile application designed to recognize and interpret hand signs (Alphabets, Numbers, Phrases) in a real-time, interactive environment. Built with React Native and TensorFlow, it empowers users to learn, practice, and test their sign language skills effectively.

### 📥 Download

You can download the latest Android APK from the [Releases Page](https://github.com/AungMyoKyaw-Jame/SignLanguageApp_ExpoGo/releases). 

## 🏗️ Project Structure

The repository is structured to separate the mobile application from the AI model training environment:

```text
NLP2026/
├── SignLanguageApp_ExpoGo/      # Main React Native Expo application
│   ├── src/
│   │   ├── assets/              # Media, sounds, and default ML models
│   │   ├── components/          # Shared reusable UI components
│   │   ├── constants/           # App-wide constants (e.g., route names)
│   │   ├── features/            # Domain-driven feature modules (dashboard, detection, learning, etc.)
│   │   ├── navigation/          # React Navigation configuration
│   │   ├── theme/               # UI styling (Light/Dark mode)
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Helper functions (haptics, audio feedback)
│   ├── App.tsx                  # App entry point
│   └── app.json                 # Expo configuration
├── model/                       # Jupyter notebooks and AI model generation scripts
└── README.md                    # Project documentation
```

### 🛠️ Tech Stack

- **Core Framework:** [React Native](https://reactnative.dev/) (via [Expo Go](https://expo.dev/))
- **Language:** TypeScript
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with `AsyncStorage` for local persistence)
- **UI & Styling:** [React Native Paper](https://callstack.github.io/react-native-paper/) (Material Design), [Lucide React Native](https://lucide.dev/) (Icons)
- **AI / Machine Learning:** [TensorFlow.js](https://www.tensorflow.org/js) for React Native, MobileNet, TensorFlow Lite
- **Hardware Integration:** 
  - `expo-camera` (Real-time computer vision)
  - `expo-haptics` (Tactile feedback)
  - `expo-speech` (Text-to-Speech audio cues)
  - `expo-image-picker` & `expo-document-picker` (Media & custom Model loading)

---

## ✨ Key Features

### 🔍 Vision & Detection
- **Real-Time Detection (Default):** Instant hand sign recognition via the live camera. You can customize the detection speed:
    - **Slow:** Detects signs every **3 seconds** (ideal for relaxed, beginner practice).
    - **Normal:** Detects signs every **1 second** (default, balanced speed).
    - **Fast:** Detects signs **immediately** (for rapid, advanced practice).
    - **Manual Trigger:** Detects only when the scan button is explicitly pressed.
- **Image Processing:** Capture photos or upload existing images from your gallery for static sign detection. *(Note: Results are not saved to device storage automatically to optimize performance and privacy).*
- **Video Analysis:** Record clips or upload videos for sequential sign detection. Users will be prompted to save the final results to their History.
- **Dynamic Model Swapping:** Seamlessly switch between different AI models on the fly without restarting the app.

### 📦 Model Packs
The app utilizes a modular architecture, allowing custom model packs to be loaded dynamically via `.zip` files.
- **Import & Extraction:** When you import a custom model pack, the app automatically extracts its contents (including the `.tflite` model, vocabulary, and images) into an isolated, dedicated directory (`packs/{id}/`) on the device.
- **Clean Deletion:** Because all assets are perfectly contained within this specific folder, deleting a model pack from the Settings > Model Manager completely wipes the folder from your device. This guarantees a clean deletion with no leftover data, preventing storage bloat.
- **Structure of a Model Pack:**
```text
sign_pack_name/
├── assets/
│   ├── model.tflite          # The TensorFlow Lite weights file
│   ├── vocabulary/
│   │   ├── word_list.json    # JSON mapping of class indices to words
│   │   ├── word_images/      # (Optional) Reference images for learning
│   └── metadata.json         # Pack info (language, version, author)
```

### 🎓 Learning & Testing
- **Curated Vocabularies:** Each loaded model pack comes with its own specific collection of words and signs.
- **Vocabulary Management:** Track your progress across different packs.
    - **Learned State:** Words are automatically marked as "Learned" once a specific accuracy threshold is met during practice.
    - **Favorites:** Manually pin words for quick access and focused repetition.
    - **Custom Lists:** Create and manage your own categorical word lists.
- **Interactive Practice:** 
    - The app prompts you to make a specific sign. If your camera input matches the target word, it marks it as complete and proceeds.
- **Gamified Test Mode:** Evaluate your skills through interactive challenges:
    - **Word Range:** Choose to test against *All Words*, *Learned Words*, *Favorites*, or *Custom Lists*.
    - **Time Attack:** Sign as many random words as possible within a strict time limit.
    - **Fixed Sprint:** Race to complete a set number of words (e.g., 10 or 20) as quickly as possible.
    - **Comprehensive Summaries:** View your Accuracy, Final Score, Time elapsed, and easily save the session to your history.

### 🌐 Store & Community Packs
- Browse, download, and rate community-contributed model packs directly within the app *(Requires an active internet connection)*.

### 📜 Activity History
- **Timeline View:** A detailed, chronological log of all past detections, learning sessions, and test scores.

### ⚙️ Settings & Configuration
*Note: The settings module has been fully decoupled from the user profile for a cleaner, centralized architecture.*
- **Theming:** Full support for Light, Dark, and System-Adaptive modes.
- **Sound & Voice:** Complete control over auditory feedback (Volume, System Sounds, Text-To-Speech Language, and Voice Rate).
- **Haptics:** Toggle device vibrations for correct/incorrect sign feedback.
- **Privacy Controls:** Easily manage Camera and Microphone permissions.
- **Data Management:** 
    - Export your learning history and logs as a `.csv` file.
    - Safely wipe all local data to reset the app.
- **System Alerts:** Toggle daily practice reminders and milestone notifications.
- **Battery Saver Mode:** Limits camera frame rates and background processing to preserve battery life.
- **Developer Tools:** Enable verbose system logging and on-screen debug tracking to troubleshoot issues.

---

## 🛠️ Technical Highlights

- **Dynamic Model Loading:** A decoupled AI architecture allowing users to swap heavy TensorFlow Lite detection models during runtime without app rebuilds.
- **Local-First Processing:** 100% of the image processing and landmark detection occurs locally on the device, ensuring zero latency and absolute user privacy.

---

## 🛡️ Non-Functional Requirements

### ⚡ Performance & Efficiency
- **Low Latency:** Real-time detection is optimized to maintain a minimum of 15-30 FPS on modern mobile devices.
- **Resource Management:** Controlled CPU/GPU allocation prevents thermal throttling during extended practice sessions.

### 🔒 Privacy & Security
- **Zero-Cloud Dependency:** User images or video streams are **never** uploaded to external servers.
- **Secure Local Storage:** Learning history and imported model packs are isolated within secure, app-specific directories.

### 📶 Offline Availability
- **100% Offline Core:** Once a model pack is downloaded, all core features (Detection, Learning, Testing, History) function seamlessly without an internet connection.

### 📱 Hardware Requirements
- **OS:** Android 8.0 (Oreo) or higher.
- **Sensors:** Functioning device camera.
- **Storage:** Adequate local storage for the base app and downloaded model packs.
- **Network:** Internet connection required *only* for the initial app download and fetching community packs.

---

## 🚀 Roadmap / Checklist

### Completed ✅
- [x] Basic UI structure and navigation (Bottom tabs: Dashboard, Detection, Learning, Profile, Settings)
- [x] State management using Zustand with persistent storage
- [x] Decoupled Settings module from Profile
- [x] Dark/Light mode theme support and haptic feedback
- [x] Local storage for activity history and logging
- [x] Core detection UI (Camera access, gallery image/video picker)
- [x] Dynamic loading of custom `.tflite` model files via Document Picker

### In Progress / Pending ⏳
- [ ] Integrate actual TensorFlow Lite model inference for real-time detection (currently using mock logic)
- [ ] Implement "Test Mode" gamification engine (Time Attack & Fixed Sprint)
- [ ] Implement full Data Export feature (CSV generation)
- [ ] Build the Online Store & Community Pack downloading system
- [ ] Explore Sentence-level sign recognition (interpreting continuous sequences)
- [ ] Cloud sync functionality for cross-device backup

---

## 🤝 Contributions

Contributions, issues, and feature requests are highly welcome!
Feel free to check the [issues page](https://github.com/AungMyoKyaw-Jame/SignLanguageApp_ExpoGo/issues).

**To contribute:**
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact
**Author:** Aung Myo Kyaw (Jame)  
**Project Link:** [https://github.com/AungMyoKyaw-Jame/SignLanguageApp_ExpoGo](https://github.com/AungMyoKyaw-Jame/SignLanguageApp_ExpoGo)

