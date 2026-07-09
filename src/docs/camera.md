# Camera Integration Plan

## 1. Overview
The current version of **SignLanguageApp** utilizes `expo-camera` to provide a live camera feed compatible with **Expo Go**. Real-time ASL detection is presently mocked to facilitate UI/UX testing and frontend prototyping without requiring custom native builds.

This document outlines the roadmap for migrating from the current mocked environment to a fully native, real-time machine learning inference pipeline.

## 2. Current Architecture (Expo Go)
- **Camera Module:** `expo-camera`
- **Detection Logic:** Mocked intervals triggering predefined sign translations.
- **Benefits:** Seamless testing on physical devices via Expo Go; rapid UI iteration.
- **Limitations:** Cannot process individual video frames natively; incapable of running on-device TFLite models against the live feed.

## 3. Proposed Native Architecture (Post-Eject / Custom Dev Client)
To achieve real-time, on-device ASL translation, we must transition to an architecture that supports frame processors and direct C++ / JNI bindings for machine learning models.

### 3.1. Required Libraries
- **`react-native-vision-camera`**: Replaces `expo-camera`. Provides robust frame processing capabilities, allowing us to hook into the camera feed frame-by-frame.
- **`react-native-fast-tflite`**: A high-performance TFLite library designed to work perfectly alongside Vision Camera frame processors.
- **`react-native-worklets`**: Required for executing frame processing logic synchronously on a separate UI/Vision thread.

### 3.2. Transition Strategy
1. **Create an Expo Custom Development Client:** We will no longer be able to use the standard Expo Go app. We will configure an Expo prebuild step (`npx expo run:android` / `npx expo run:ios`).
2. **Swap Camera Components:** Replace all instances of `expo-camera` in `src/features/detection/` with `<Camera>` from `react-native-vision-camera`.
3. **Implement Frame Processor:**
   - Attach a `useFrameProcessor` hook to the camera.
   - Resize and format the incoming frames (e.g., to 224x224 RGB) to match the model's expected input tensor.
4. **Integrate TFLite Model:**
   - Load the user-selected `.tflite` model (managed by the `learning` feature store).
   - Pass the formatted frame into the model for inference.
   - Extract the highest confidence prediction.
5. **Debouncing & Smoothing:** Implement a moving average or debouncing function to prevent erratic UI updates and ensure the TTS engine isn't overwhelmed by fluctuating predictions.

## 4. UI/UX Considerations
- **Bounding Boxes & Landmarks:** Once native detection is implemented, consider drawing bounding boxes around hands or overlaying pose landmarks using an SVG or Canvas overlay synced with the frame processor.
- **Camera Permissions:** Ensure graceful fallbacks and informative UI prompts when camera permissions are denied or restricted.
- **Performance Monitoring:** Add an FPS counter during development to monitor the overhead of the TFLite inference.

## 5. Next Steps
1. Finalize UI/UX testing on Expo Go.
2. Branch the repository for native integration.
3. Install `react-native-vision-camera` and configure the custom dev client.
4. Implement a dummy frame processor to benchmark base camera performance.
5. Integrate `react-native-fast-tflite` and test with a lightweight hand-detection or ASL classification model.

npx expo run:android
# or
npx expo run:ios
