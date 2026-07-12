# How to work with the app

This document provides a quick start guide for setting up and working with both the mobile application and the AI modeling environment of the **NLP2026** project.

---

## 1. Running the Mobile Application (Frontend)

The frontend is a React Native app managed by Expo, located in the `src/` directory. 

### Prerequisites
- **Node.js** (v18 or newer)
- **Expo Go** app installed on your physical mobile device (available on Google Play Store / App Store)

### Quick Start
1. Open your terminal and navigate to the `src` directory:
   ```bash
   cd src
   ```
2. Install the JavaScript dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Use the **Expo Go** app on your phone to scan the QR code displayed in the terminal. The app will bundle and launch automatically on your device.

*(Note: For advanced native builds, refer to `src/README.md`)*

---

## 2. Working with the AI Models (Backend/Training)

The AI modeling environment, scripts, and notebooks are located in the `models/` directory.

### Prerequisites
- **Python** (v3.8 or newer)

### Quick Start
1. From the root directory of the project (`NLP2026/`), install the required Python dependencies. It is highly recommended to use a virtual environment:
   ```bash
   # Optional: Create and activate a virtual environment
   # python -m venv venv
   # source venv/bin/activate  (Linux/Mac) or .\venv\Scripts\activate (Windows)

   pip install -r requirements.txt
   ```
2. Navigate to the models directory:
   ```bash
   cd models
   ```
3. Here, you can:
   - Open Jupyter Notebooks in `notebook/` to explore training experiments.
   - Use `crop.py` and `generator.py` for data processing.
   - Check `../configs/models_config.json` to review available model metadata.

---

## 3. Loading Custom Models into the App

The mobile application supports dynamic model swapping. To load a model you trained:
1. Export your model into a model pack `.zip` file. This pack must contain the `.tflite` model file, `metadata.json`, and `vocabulary/word_list.json`.
2. Transfer the `.zip` file to your mobile device (via email, Google Drive, or cable).
3. Open the **Sign Language Detector App** on your phone.
4. Navigate to **Settings > Model Manager** and tap **Import Model Pack**.
5. Select the transferred `.zip` file. The app will extract the assets and you can immediately switch to your custom model for real-time sign detection!
