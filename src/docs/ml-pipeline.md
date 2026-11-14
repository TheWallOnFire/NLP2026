# Machine Learning Pipeline Architecture

This document describes the high-performance on-device Machine Learning pipeline implemented in the **Sign Language Detector** application.

---

## 1. Architectural Strategy: The Dual-Loop Pipeline

Running deep learning classification on every camera frame at 30-60 FPS on mobile devices quickly causes thermal throttling, battery drain, and UI thread stutter. To achieve fluid responsiveness while maintaining high accuracy, the system divides the workload into **two coordinated, asynchronous loops**:

```text
               Camera Snapshot (10-15 FPS)
                            │
                            ▼
              ┌───────────────────────────┐
              │  LOOP 1: Tracking Loop    │
              │  - MediaPipe SSD (Find)   │
              │  - CamShift (Follow)      │
              └─────────────┬─────────────┘
                            │ Target Box Coordinates [0..1]
                            ▼
              ┌───────────────────────────┐
              │  UI Thread Animation      │
              │  Reanimated SharedValues  │
              │  (Spring Physics 60 FPS)  │
              └─────────────┬─────────────┘
                            │ When State == TRACKING
                            ▼
              ┌───────────────────────────┐
              │  LOOP 2: Recognition Loop │
              │  - Square Crop (224x224)  │
              │  - Background C++ TFLite  │
              │  - MobileNetV2 Inference  │
              └─────────────┬─────────────┘
                            │
                            ▼
              Sign Prediction & Confidence
```

---

## 2. Loop 1: Hand Localization & Tracking

### A. MediaPipe Palm Detection (State: `SEARCHING`)
- **Model:** Google MediaPipe Palm Detection (Full model, 192x192 input).
- **Architecture:** Single-Shot Detector (SSD) with 2,016 anchor boxes across two feature map strides:
  - 24x24 feature map (stride 8) x 2 anchors = 1,152 anchors
  - 12x12 feature map (stride 16) x 6 anchors = 864 anchors
- **Preprocessing:** The raw camera frame is converted using the **Squash Transform** (scaling to 192x192 without aspect crop) so the entire camera view is scanned. Pixel values are normalized to `[0, 1]`.
- **Decoding:** The anchor with the highest logit is selected. After sigmoid activation, if confidence exceeds `DYNAMIC_THRESHOLD` (0.65 for initial acquisition, 0.20 for hysteresis re-acquisition), the hand bounding box is extracted and expanded by 2.0x with safe padding to form a square bounding box.
- **State Transition:** Switches to `TRACKING` state.

### B. CamShift Skin-Color Tracker (State: `TRACKING`)
- To avoid invoking the heavy Palm Detection model on every frame, the system switches to **CamShift** (Continuously Adaptive Mean Shift):
  - **HSV Color Space:** RGB pixels are converted to HSV. Brightness extremes (glare and deep shadows) are masked out, focusing strictly on Hue.
  - **Adaptive Hue Histogram:** The target skin hue is continuously blended with 5% of the current frame's observed hue, allowing seamless tracking across varied lighting conditions.
  - **Exponential Top-Bias:** Pixels in the upper third of the tracking window receive exponentially weighted significance (up to 20x), pinning the center of mass to the fingers and palm rather than drifting down to the forearm.
  - **Boundary Guard:** If the hand touches the camera edge (`EDGE_MARGIN = 10px`) or is completely occluded, tracking resets back to `SEARCHING`.

---

## 3. Loop 2: Sign Language Classification

- **Trigger:** Executes periodically (1–2 FPS) only when Loop 1 reports `TRACKING`.
- **Target Crop:** Using the relative coordinates `[0..1]` from Loop 1, `expo-image-manipulator` crops exactly the square region enclosing the hand from the high-resolution snapshot and resizes it to the target model input (e.g. 224x224).
- **Asynchronous C++ Inference:**
  - Instead of blocking the JS event loop with synchronous calls, inference runs via `await tfliteModel.run([inputData.buffer])`.
  - Execution occurs on a native C++ worker thread managed by `react-native-fast-tflite` with **XNNPACK** CPU acceleration.
- **Output Parsing:**
  - `parseInferenceOutput` inspects output tensors with memory offset awareness (`byteOffset`) to prevent cross-tensor pointer corruption.
  - Generates top-1 predicted class, top-3 candidates with confidence scores, and passes them to the UI, TTS, and History systems.

---

## 4. Normalization Handling

Different model architectures expect different input distributions:
- `[0, 1]`: Pixels divided by 255.0 (MobileNetV2 standard, MediaPipe Palm).
- `[-1, 1]`: `(pixel / 127.5) - 1.0` (Keras MobileNetV2 default).
- `[0, 255]`: Raw uint8 float representation (EfficientNetB0).

The normalization mode is read dynamically from each Model Pack's `metadata.json` (`normalization` field) in `prepareImageForModel` and `convertPixelsToInputData`.
