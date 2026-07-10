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


---

## 🛠️ Build & Development Instructions

### Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 18+ | JavaScript runtime |
| [npm](https://www.npmjs.com/) | 9+ | Package manager (ships with Node) |
| [Expo CLI](https://docs.expo.dev/get-started/installation/) | Latest | `npm install -g expo-cli` |
| [EAS CLI](https://docs.expo.dev/build/introduction/) | Latest | `npm install -g eas-cli` (for cloud builds) |
| [Android Studio](https://developer.android.com/studio) | Latest | Android SDK & Emulator (for local Android builds) |
| [Xcode](https://developer.apple.com/xcode/) | 15+ | iOS Simulator & builds *(macOS only)* |

### 📦 Installation

Clone the repository and install dependencies:

# Install dependencies
npm install
```

---

### 🖥️ Local Development (Development Mode)

Run the app locally on an emulator or physical device **without** EAS cloud builds:

**1. Generate native project files:**
```bash
# Generate the android/ and ios/ directories from Expo config
npx expo prebuild

# Use --clean to regenerate from scratch (recommended after config changes)
npx expo prebuild --clean
```

**2. Start the development server:**
```bash
# Start the Expo dev server (Metro bundler)
npx expo start

# Clear Metro cache if you encounter stale bundle issues
npx expo start -c
```

**3. Run on a device or emulator:**
```bash
# Run directly on a connected Android device / emulator
npx expo run:android

# Run on iOS Simulator (macOS only)
npx expo run:ios
```

> **💡 Tip:** Connect a physical device via USB with USB Debugging enabled, or launch an Android Emulator / iOS Simulator before running the commands above.

#### Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo development server |
| `npm run android` | Build & run on Android device/emulator |
| `npm run ios` | Build & run on iOS Simulator *(macOS only)* |`
| `npm run web` | Start the app in a web browser |

---

### 🏗️ Local Builds (EAS Local)

If you want to compile the `.apk`, `.aab`, or `.ipa` directly on your machine without using Expo's cloud servers, you can use the `--local` flag.

**Prerequisites for Local Builds:**
- **Android:** Android Studio, Android SDK, and Java JDK must be installed and configured in your environment variables.
- **iOS:** Xcode must be installed (macOS only).

**Generate Local Build:**
```bash
# Build Android APK/AAB locally
eas build -p android --profile production --local

# Build iOS IPA locally (macOS only)
eas build -p ios --profile production --local
```
The output file (`.apk`, `.aab`, or `.tar.gz` for iOS simulator) will be saved directly in your project folder.

---

### ☁️ Cloud Builds (EAS)

Alternatively, you can use [Expo Application Services (EAS)](https://expo.dev/eas) to compile the app on the cloud:

```bash
## Cloud preview build
eas build -p android --profile preview


# Cloud Development Build
eas build -p android --profile development
eas build -p ios --profile development

# Cloud Production Build
eas build -p android --profile production
eas build -p ios --profile production
```

---

### 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Metro bundler cache issues | `npx expo start -c` |
| Stale native code after config change | `npx expo prebuild --clean` |
| Missing Android SDK | Install via Android Studio → SDK Manager |
| `eas` command not found | `npm install -g eas-cli` |
| Permission denied on device | Enable **USB Debugging** in Developer Options |