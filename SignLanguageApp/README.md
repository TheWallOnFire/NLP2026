# SignLanguageApp - Native AI Translate

This is a React Native (Expo) application designed to translate American Sign Language (ASL) into real-time text and speech. The application runs on a pure native C++ AI pipeline for maximum performance.

## Features
- **Real-time Camera Feed:** Built using `react-native-vision-camera` to stream the live view directly to native frame processors.
- **Native AI Execution:** Utilizes `react-native-fast-tflite` to run models at 60 FPS on the device's NPU/GPU without the overhead of JavaScript or WebGL.
- **Multi-threaded Worklets:** Relies on `react-native-worklets-core` to ensure the main UI thread never freezes during ML inference.
- **Dynamic Model Loading:** Features a custom `.tflite` model picker using `expo-document-picker`. Users can download their own TFLite models to their device and load them directly into the app.
- **Text-to-Speech (TTS):** When a sign is detected with high confidence, the app uses `expo-speech` to speak the word aloud, enabling immediate communication.
- **Offline First:** Designed to run heavy models purely on-device.

## Getting Started

> [!WARNING]
> Because this app uses Native Frame Processors and C++ modules, **it cannot be run on the standard Expo Go app**. You must compile the native binary.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the app natively:**
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

3. Connect a physical Android or iOS device via USB. Emulators often lack camera support or sufficient GPU acceleration for smooth tracking.

## Project Structure
- `src/features/detection/`: Contains the core `DetectionScreen` with Vision Camera frame processors, fast-tflite AI inference, and TTS audio.
- `src/features/learning/`: Contains the model pack store (Zustand) and dynamic custom model loading logic.
- `src/features/history/`: Contains the global Zustand store tracking past translations.
- `src/navigation/`: The bottom tab navigator integrating all features.
