# SignLanguageApp - Expo Go Edition

This is a React Native (Expo) application designed to simulate translating American Sign Language (ASL) into real-time text and speech. 

> [!NOTE]
> **Expo Go Compatible Version**
> This version of the application has been specifically modified to run seamlessly on **Expo Go**. Heavy native AI libraries (like `react-native-vision-camera` and `react-native-fast-tflite`) have been removed to eliminate the need for custom native builds (`npx expo run:android`). The detection features in the app currently run in a "mock" mode for UI/UX testing and frontend prototyping.

## Features
- **Camera Feed:** Built using the standard `expo-camera` to stream live views natively within Expo Go.
- **Dynamic Model UI:** Features a custom model picker UI. Users can visually load model packs and simulate swapping detection engines.
- **Text-to-Speech (TTS):** When a sign is detected (mocked), the app uses `expo-speech` to speak the word aloud, enabling immediate communication.
- **Expo Go Ready:** Runs smoothly out of the box without requiring native compilation, Android Studio, or XCode.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the app via Expo Go:**
   ```bash
   npm start
   # or
   npx expo start
   ```

3. Download the **Expo Go** app on your physical iOS or Android device, and scan the QR code displayed in the terminal to launch the app instantly.

## Project Structure
- `src/features/detection/`: Contains the core `DetectionScreen` with the `expo-camera` implementation and mock detection interval logic.
- `src/features/learning/`: Contains the model pack store (Zustand) and dynamic custom model loading UI logic.
- `src/features/history/`: Contains the global Zustand store tracking past mock translations.
- `src/navigation/`: The bottom tab navigator integrating all features.
