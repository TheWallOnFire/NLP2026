# Machine Learning Pipeline (Expo Go constraints)

## The Limitation of Expo Go
In the **Native** version of this app (`SignLanguageApp_Native`), the camera logic is offloaded entirely to Native C++ layers (using `react-native-vision-camera` and `react-native-fast-tflite`). This provides instantaneous frame processing (60fps) but completely breaks the Expo Go sandbox because Expo Go does not contain these custom native modules.

## The Solution: "Bounding Box" + TensorFlow.js
To maintain 100% compatibility with Expo Go while still performing local, offline Machine Learning, this project utilizes a different approach:

1. **The Bounding Box UI:**
   Instead of forcing the AI to scan the entire screen (which is slow in JavaScript), we instruct the user to place their hand inside a defined square overlay (the "Bounding Box").
   
2. **Cropping & Sampling:**
   Every interval (e.g., 500ms), the app grabs a low-resolution snapshot specifically restricted to the dimensions of that bounding box.

3. **Inference with TFJS:**
   That cropped image is converted into a tensor and passed into `TensorFlow.js` (`@tensorflow/tfjs-react-native`). We use a lightweight classification model (like MobileNetV2) rather than heavy pose-estimation models. This allows inference to happen entirely on the JavaScript thread (via WebGL) fast enough to simulate real-time translation without crashing Expo Go.

## Mock Mode
Currently, while the ML models are being finalized and trained in the Jupyter notebooks, the detection loop in `DetectionScreen.tsx` may run in a **mock mode**. This means the app simulates receiving classification results to allow frontend UI/UX testing (like triggering Text-to-Speech and updating History logs) without requiring the actual `model.tflite` file to successfully output predictions.
