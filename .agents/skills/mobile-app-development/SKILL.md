---
name: mobile-app-development
description: >-
  Use this skill when developing, debugging, building, or troubleshooting the React Native
  and Expo mobile application (src/) for the NLP2026 project. Covers Expo Prebuild,
  EAS Build, native C++ Nitro Modules, VisionCamera v5, fast-tflite configuration,
  Metro bundler caching, and Android/iOS setup.
---

# Mobile Application Development & Build Skill

This skill guides AI agents through modifying, debugging, configuring, and building the React Native / Expo mobile application located in `src/`.

---

## 1. When to Use This Skill
- Adding or modifying UI screens, components, hooks, or stores in `src/src/`.
- Configuring native modules, Android permissions, or iOS plists in `src/app.json`.
- Debugging build errors related to `react-native-fast-tflite`, `react-native-nitro-modules`, or `react-native-vision-camera`.
- Resolving Metro bundler caching issues or native library symbol collisions.
- Creating native builds using Expo Prebuild or EAS Build.

---

## 2. Architecture & Runtime Constraints

### ⚠️ Native Dev Client Required (Not Vanilla Expo Go)
The mobile app relies on native C++ libraries:
- `react-native-fast-tflite` (TFLite C++ engine with XNNPACK)
- `react-native-nitro-modules` (C++ Hybrid Objects & JSI zero-copy buffers)
- `react-native-nitro-image` (Zero-copy C++ pixel extraction)
- `react-native-vision-camera` (v5 high-speed native camera)
- `expo-video` & `react-native-reanimated`

**Vanilla Expo Go CANNOT run these native modules directly.** Developers must use **Expo Prebuild** or **EAS Build** to generate a development build.

### 🛡️ Core Stability Invariants
1. **FileSystem Import:** Always import from `expo-file-system/legacy` to avoid breaking changes with Expo SDK 54's next-gen FileSystem API.
2. **Error Boundary:** The root navigator in `App.tsx` is wrapped in `<ErrorBoundary>` to catch unhandled component crashes gracefully.
3. **Safe Area Insets:** Since `MainTabs` applies bottom navigation padding, screens inside tabs (like `DetectionScreen`) must use `edges={['top', 'left', 'right']}` to prevent double padding.

---

## 3. Standard Development Workflows

### Workflow 1: Installing Dependencies
Always run package management commands inside `src/`:
```bash
cd src
npm install
```

### Workflow 2: Generating Native Projects (Expo Prebuild)
Whenever `app.json`, native plugins, or native dependencies change:
```bash
cd src
npx expo prebuild --clean
```
This generates fresh `android/` and `ios/` native folders based on the configuration in `app.json`.

### Workflow 3: Running the Metro Development Server
Always clear cache if experiencing stale bundle issues or module resolution errors:
```bash
cd src
npx expo start -c
```

### Workflow 4: Running on Android Device or Emulator
Ensure an Android device is connected via USB (with USB Debugging enabled) or an emulator is running:
```bash
cd src
npx expo run:android
```

### Workflow 5: Cloud Builds with EAS Build
```bash
cd src
# Build an installable APK for testing
eas build --platform android --profile preview
```

---

## 4. Key Configuration Files

- **`src/app.json`**:
  - `plugins`: Must declare `react-native-fast-tflite`, `expo-camera`, and `expo-build-properties`.
  - `packagingOptions`: `pickFirst` must include `libc++_shared.so` architectures to prevent Duplicate Library build errors.
  - `android.minSdkVersion`: Set to `26` (Android 8.0 Oreo) or higher for VisionCamera and TFLite compatibility.
- **`src/metro.config.js`**:
  - `config.resolver.assetExts.push('tflite')`: Ensures Metro bundles `.tflite` files as static assets.
- **`src/babel.config.js`**:
  - Must include `react-native-reanimated/plugin` as the last plugin in the plugins array.

See [build_troubleshooting.md](./references/build_troubleshooting.md) for solutions to common build issues.
