# NLP2026 — Troubleshooting & Developer FAQ

This guide provides targeted solutions for common development, build, and runtime issues encountered when working on the **NLP2026** codebase.

---

## 1. Build & Environment Issues

### Q: Why does the app fail or throw missing native module errors when running in Expo Go?
**A:** The app relies on native C++ libraries (`react-native-fast-tflite`, `react-native-nitro-modules`, `react-native-nitro-image`, and `react-native-vision-camera`). These C++ native dependencies **cannot** execute inside standard Expo Go.  
**Solution:**
You must run the app using an **Expo Development Client** (Prebuild) or EAS Build:
```bash
# Clean prebuild and generate native project files
npx expo prebuild --clean

# Run native Android debug build
npx expo run:android

# Or run native iOS debug build
npx expo run:ios
```

---

### Q: Metro bundler throws `Unable to resolve module ... palm_detection.tflite`
**A:** The bundler failed to resolve the bundled MediaPipe model.  
**Solution:**
Ensure `src/assets/models/palm_detection.tflite` exists and Metro cache is wiped:
```bash
npx expo start -c
```

---

## 2. Camera & Tracking Pipeline

### Q: Why is detection output jumping or producing ghost detections with confidence 900+?
**A:** This is a symptom of incorrect input tensor normalization.  
- **MediaPipe Palm Model:** Strictly expects inputs normalized to `[0, 1]` (`pixel * (1 / 255.0)`).
- **MobileNetV2 ASL Model:** Expects `[0, 1]` for the default pack, or `[-1, 1]` if configured in `metadata.json`.  
Normalizing the Palm model to `[-1, 1]` causes logit explosions and false activations.

---

### Q: The camera preview is black on Android after returning from background.
**A:** Android suspends native camera sessions when entering the background.  
**Solution:**
The app automatically synchronizes with `AppState.addEventListener('change')` and sets `isActive={isFocused && isAppActive}` on `<Camera />`. Ensure battery-saver modes are not force-killing the camera HAL daemon.

---

## 3. Storage & Memory Hygiene

### Q: Does continuous Auto-Detection cause device storage to fill up?
**A:** No. All high-frequency camera snapshots and tracking crops are automatically purged from `FileSystem.cacheDirectory` in `finally` blocks immediately after pixel extraction. Furthermore, on app mount, [useDetectionLogic.ts](file:///d:/VScode/NLP2026/src/src/features/detection/hooks/useDetectionLogic.ts) automatically deletes orphaned `captured_media/`, `ImageManipulator/`, and `Camera/` cache directories.

---

### Q: How do I cleanly uninstall a custom Model Pack?
**A:** In Settings -> Model Pack Manager, delete the pack. The app deletes both the persistent SQLite/AsyncStorage metadata and the sandboxed filesystem directory `${FileSystem.documentDirectory}packs/{packId}/`.

---

## 4. AI & Model Verification

### Q: How do I test the trained models without running the mobile app?
**A:** Use the Python test suite in `tests/`:
```bash
# Run all tests sequentially
python tests/test.py --all

# Run a specific test
python tests/test.py --run 03_test_tflite_shapes.py

# Or run the interactive menu
python tests/test.py
```

