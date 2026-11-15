# Mobile App Build Troubleshooting Guide

## 1. Duplicate `libc++_shared.so` Error (Android)
### Symptom:
```text
2 files found with path 'lib/arm64-v8a/libc++_shared.so' from inputs:
 - .../react-native-fast-tflite/...
 - .../react-native-nitro-modules/...
```
### Solution:
Verify that `src/app.json` contains the `pickFirst` packaging options under `expo-build-properties`:
```json
[
  "expo-build-properties",
  {
    "android": {
      "minSdkVersion": 26,
      "packagingOptions": {
        "pickFirst": [
          "lib/x86/libc++_shared.so",
          "lib/x86_64/libc++_shared.so",
          "lib/armeabi-v7a/libc++_shared.so",
          "lib/arm64-v8a/libc++_shared.so"
        ]
      }
    }
  }
]
```
After modifying `app.json`, regenerate native projects with `npx expo prebuild --clean`.

---

## 2. "Unable to resolve module ... .tflite"
### Symptom:
Metro bundler throws a bundling error when requiring `.tflite` files (e.g. `Asset.loadAsync(require(...))`):
```text
Unable to resolve module ../../../../assets/models/palm_detection.tflite
```
### Solutions:
1. Ensure the file actually exists at `src/assets/models/palm_detection.tflite`.
2. Ensure `src/metro.config.js` has:
   ```javascript
   config.resolver.assetExts.push('tflite');
   ```
3. Restart Metro with cache cleared:
   ```bash
   npx expo start -c
   ```

---

## 3. NNAPI Crash / Garbage Outputs on Android
### Symptom:
The TFLite model loads without error but outputs identical predictions (e.g., class index 12 with 0.333 confidence) regardless of input.
### Cause:
NNAPI delegate memory-mapping incompatibility on certain Android chipsets when accessed via JSI TypedArrays.
### Solution:
In `useSignLanguageModel.ts` and `MLDiagnosticScreen.tsx`, always load with CPU delegation on Android:
```typescript
if (Platform.OS === 'android') {
  // Pass empty delegates array to force CPU + XNNPACK
  m = await loadTensorflowModel({ url: urlToLoad }, []);
}
```

---

## 4. Reanimated Worklet Crash
### Symptom:
```text
_setGlobalConsole is not a function or Worklet is undefined
```
### Solution:
1. Ensure `react-native-reanimated/plugin` is the last plugin in `babel.config.js`.
2. Clear Metro cache: `npx expo start -c`.
