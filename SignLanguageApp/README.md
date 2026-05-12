# Sign Language Detector App (Frontend)

This directory contains the React Native/Expo frontend for the Sign Language Detector project. 

## 🌟 Overview
This mobile application is built using React Native and Expo. It provides the user interface and logic for real-time hand sign recognition, learning modules, activity history, and settings management as defined in the main project specifications.

## 🛠️ Tech Stack
- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (Bottom Tabs & Native Stack)
- **State Management:** Zustand
- **UI Components:** React Native Paper
- **Icons:** Lucide React Native

## 📂 Project Structure

```text
SignLanguageApp/
├── src/
│   ├── components/    # Reusable UI components (buttons, modals, etc.)
│   ├── navigation/    # AppNavigator and routing configurations
│   ├── screens/       # Main views (Detection, Learning, History, Settings)
│   ├── store/         # Zustand global state stores
│   └── theme/         # Color palettes, typography, and theme config
├── App.tsx            # Main entry point of the application
├── app.json           # Expo configuration file
└── package.json       # Project dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed. You should also have the **Expo Go** app installed on your physical mobile device if you wish to run it there.

### Installation
1. Navigate to this directory:
   ```bash
   cd SignLanguageApp
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the Expo development server:
```bash
npx expo start
```
From here, you can:
- **Scan the QR code** with your phone's camera (iOS) or the Expo Go app (Android).
- Press `a` to open in an Android Emulator (if Android Studio is installed and running).
- Press `i` to open in an iOS Simulator (if on a Mac with Xcode installed).
- Press `w` to open it in a web browser.

## ⚙️ Key Features in Development
- **Detection Screen:** Integration with Camera and MediaPipe for offline real-time sign language translation.
- **Learning Screen:** Interactive modules to test and learn downloaded model packs.
- **History Screen:** A timeline logging user progress and past detections.
- **Settings:** Customizable preferences for dark mode, audio/haptic feedback, and storage management.
