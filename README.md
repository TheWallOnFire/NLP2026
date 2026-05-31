# 👋 Sign Language Detector App

> **Bridging the communication gap through real-time AI-powered hand sign recognition.**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![MediaPipe](https://img.shields.io/badge/Vision-MediaPipe-orange.svg)
![React Native](https://img.shields.io/badge/React%20Native-3.8+-green.svg)
![Tensorflow](https://img.shields.io/badge/TensorFlow-Lite-orange.svg)


## 🌟 Overview

The **Sign Language Detector App** is an offline mobile app, designed to recognize and interpret hand signs (Alphabet, Numbers, Phrases) in a real-time, interactive manner, helping users learn and practice sign language effectively.

---

## ✨ Key Features

### 🔍 Vision & Detection
- **Real-Time Detection (Default):** Instant hand sign recognition via live camera. Can choose speed of detection:
    - **Slow:** Detects signs every **3 seconds** (best for relaxed practice).
    - **Normal:** Detects signs every **1 second** (default, balanced speed).
    - **Fast:** Detects signs **immediately** upon detection (for rapid practice).
    - **Off:** Manual Trigger mode (detects only when button is pressed).
- **Image Processing:** Capture photos or upload existing images from your gallery to detect hand signs. Wont save the result for perfomance issues.
- **Video Analysis:** Record clips or upload videos for sequential sign detection. Ask user to save the result to history screen.
- **Gallery Integration:** Directly browse and select media from your device's native gallery apps. 
- **Change model pack:** Can change model used. When change need to load the pack for a moment then can be use. 


### 🎓 Learning & Testing
- **Installed model pack collection:** Each model packs go with its collection of words.
- **Learn and Test Screen:** can learn and test with the installed model pack. The screen will update the pack's collection for each of saved model packs. 
- **Manage words:** can manage words of each packs's collection, not all.  Including features: 
    - **Learned State:** Automatically mark words as "Learned" once you achieve a certain accuracy threshold.
    - **Favorites:** Manually mark words as "Favorite" for quick access and focused practice. This is the main sub category
    - **Custom:** Create and manage list of custom words categories
- **Interactive Learning:**
    - **Learning:** Practice how to make hand sign for the choosen word. If sign matches the choosen word, it will mark as learned and go to the next word.
    - **Practice:** Randomly pick a word in learned or favorite to practice again. 
- **Test Mode:** A gamified "typing game" experience with customizable parameters:
    - **Word Range:** Test yourself on **All Words**, only **Learned Words**, **Favorites**, or **Custom**.
    - **Test Types:**
        - **Time Attack:** Sign as many words as possible within a limited time or endless, with word random from pack collection.
        - **Fixed Sprint:** Complete a set number of words (e.g., 10, 20, or all), with word random from pack collection.
    - **When finished:** it will show the summary of the test, including:
        - **Accuracy:** The percentage of correct signs.
        - **Score:** The number of correct signs.
        - **Time:** The time it took to complete the test.
        - **Words:** The list of words tested.
        - **Save to History?:** Ask user to save the result to history or not.  

### Store and community pack
- Work only when online


### 📜 Activity History
- **Timeline View:** A chronological log of all your past detections, learning sessions, and tests. Click on any entry to view details.


### ⚙️ Settings
*Note: The settings module has been fully decoupled from the user profile for a cleaner, centralized architecture.*
- **Theme:** Full support for Light, Dark, and Mixed modes with customizable color palettes.
- **Sound & Voice:** Change sound effect, volume, TTS language and voice rate.
    - **System Sounds:** High-quality sound effects for generic actions (opening pages, clicking buttons, etc.).
    - **Learning Feedback:** Unique "Correct" and "Incorrect" audio cues to guide you through learning sessions.
    - **Capture Notification:** A distinct "Shutter/Ping" sound to notify you when a sign has been successfully captured.
- **Camera:** Tinker with camera options
- **Haptics:** control haptics feedback for correct/incorrect signs and other actions
- **Permission:** Control permission for camera, microphone, etc.
- **Storage:** Manage storage.
    - **Custom Folders:** Define where to save recorded media and progress logs.
    - **History Management:** Toggle local logging and export learning data as CSV.
- **Model:** Select model pack to use. Can import model pack from device storage. 
- **System & Alerts:**
    - **Notification Center:** Daily practice reminders, milestone alerts, and achievement pop-ups.
    - **Power Management:** Toggle a high-efficiency "Battery Saver" mode which limits frame rate and background processing.
- **Delete data:** Allow user to delete data in history, custom words, etc.
- **Export data:** Allow user to export data to CSV file.
- **Developer Debug Mode:** Enable verbose system logging, on-screen error tracking, and a "Export Debug Log" feature to assist in fixing technical issues.

### ⚙️ Customization & Flexibility
- **Model Portability:** No hard-coded models! Download or purchase new model files and load them directly via settings. Model pack content:
    - **Model:** .tflite file 
    - **Word list:** A collection of high-quality reference images and metadata for each sign in the pack.
---

## 🛠️ Technical Highlights

- **Dynamic Model Loading:** Decoupled architecture allowing users to swap detection models on the fly.
- **Modular Model Packs:** A standardized format for sign language data, enabling easy community-made or official dialect updates.

---

## ✨ Non-Functional Requirements

To ensure a high-quality user experience and technical reliability, the app adheres to the following non-functional requirements:

### ⚡ Performance & Efficiency
- **Low Latency:** Real-time detection must maintain a minimum of 15-30 FPS for smooth tracking on modern mobile devices.
- **Resource Management:** Optimized CPU/GPU usage to prevent overheating during extended learning sessions.
- **Battery Optimization:** Minimal background activity to preserve device longevity.

### 🔒 Privacy & Security
- **Local-First Data:** All image processing and landmark detection occur locally on the device.
- **Zero-Cloud Dependency:** No user images or videos are ever uploaded to external servers, ensuring total user privacy.
- **Secure Storage:** Learning history and custom model packs are stored in secure, app-specific directories.

### 📶 Offline Availability
- **100% Offline Core:** All core features, including sign detection, learning modes, and history tracking, must function without an internet connection.
- **Self-Contained Packs:** Model packs must include all necessary assets (weights + images) for full offline utility.

### ♿ Usability & Accessibility
- **Intuitive UX:** A clean, distraction-free interface suitable for all age groups.
- **Multi-Modal Feedback:** Combination of visual (skeletal overlay), auditory (TTS), and tactile (haptics) feedback to assist users with different needs.
- **Responsive Design:** Seamless layout adjustments across various screen sizes (phones, tablets).

### Hardware specification
- A phone with Android 8.0 or higher
- A working camera
- A working microphone
- Enough storage space for the app and model packs
- A working internet connection (only for the first time)
---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

## 🤝 Contact
Your Name - [@yourhandle](https://twitter.com/yourhandle) - email@example.com

Project Link: [https://github.com/your-username/NLP2026](https://github.com/your-username/NLP2026)