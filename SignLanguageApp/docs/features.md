# Comprehensive Feature List

This document outlines all the intended features for the **Sign Language App**, both implemented and planned. In this **Expo Go Edition**, many of the real-time detection aspects run using a "Bounding Box" + TFJS approach or a mock data pipeline for UI testing, but the overall feature set remains the same.

## 🔍 Vision & Detection
- **Real-Time Detection (Bounding Box):** Instant hand sign recognition via live camera using a target box. You can configure the speed of detection:
  - **Slow:** Detects signs every **3 seconds** (best for relaxed practice).
  - **Normal:** Detects signs every **1 second** (default, balanced speed).
  - **Fast:** Detects signs **immediately** upon detection (for rapid practice).
  - **Off:** Manual Trigger mode (detects only when the capture button is pressed).
- **Image Processing:** Capture photos or upload existing images from your gallery to detect hand signs. Results are not saved automatically to conserve storage.
- **Video Analysis:** Record clips or upload videos for sequential sign detection. Users are prompted to save the result to the history screen after processing.
- **Gallery Integration:** Directly browse and select media from your device's native gallery apps.
- **Dynamic Model Swapping:** Seamlessly switch the active machine learning model pack. The UI displays a loading overlay while the new pack is initialized.

## 🎓 Learning & Testing
- **Model Pack Collections:** Each installed model pack comes with its own collection of reference words and images.
- **Learn and Test Hub:** A dedicated space to learn and test against the currently active model pack. The UI updates dynamically based on the pack's vocabulary.
- **Vocabulary Management:** Organize the words within each pack's collection:
  - **Learned State:** Automatically marks words as "Learned" once you achieve a certain accuracy threshold during practice.
  - **Favorites:** Manually mark words as "Favorite" for quick access and focused practice.
  - **Custom Lists:** Create and manage custom categories of words.
- **Interactive Learning:**
  - **Learning Mode:** Practice making the hand sign for a chosen word. If the model detects the correct sign, it marks it as learned and advances to the next word.
  - **Practice Mode:** Randomly picks a word from your "Learned" or "Favorites" list to reinforce memory.
- **Test Mode (Gamified):** A "typing game" experience with customizable parameters:
  - **Word Range:** Test yourself on **All Words**, **Learned Words**, **Favorites**, or **Custom** lists.
  - **Time Attack:** Sign as many words as possible within a limited time (or endless mode) with random words from the pack.
  - **Fixed Sprint:** Complete a set number of words (e.g., 10, 20, or all) with random words from the pack.
  - **Post-Test Summary:** Displays Accuracy (%), Score, Time Taken, and the list of words tested. Users are prompted to save these results to their history.

## 📜 Activity History
- **Timeline View:** A chronological log of all your past detections, learning sessions, and tests. Clicking on any entry opens a detailed view of that specific session.

## ⚙️ Settings & Customization
- **Theme:** Full support for Light, Dark, and Mixed modes with customizable color palettes.
- **Sound & Voice:** Adjust sound effects, volume, TTS language, and voice rate.
  - **System Sounds:** High-quality sound effects for generic UI actions (opening pages, clicking buttons).
  - **Learning Feedback:** Unique "Correct" and "Incorrect" audio cues to guide you through learning sessions.
  - **Capture Notification:** A distinct "Shutter/Ping" sound to notify you when a sign has been successfully captured.
- **Haptics:** Fine-grained control over haptic feedback for correct/incorrect signs and UI interactions.
- **Storage Management:**
  - Define custom folders for saving recorded media and progress logs.
  - Toggle local logging on/off.
  - Export learning data and history as a CSV file.
- **System & Alerts:**
  - **Notification Center:** Daily practice reminders, milestone alerts, and achievement pop-ups.
  - **Power Management:** A "Battery Saver" mode which limits frame rate and background processing to save device battery.
- **Data Control:** Options to permanently delete data in history, custom words, and user profiles.
- **Developer Debug Mode:** Enables verbose system logging and on-screen error tracking for technical troubleshooting.
