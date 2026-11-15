# Comprehensive Feature List

This document provides a detailed catalog of the features implemented in the **Sign Language Detector** application.

---

## 🔍 1. Vision & Detection

- **Autonomous Hand Tracking (Auto Mode - Default):**
  - Instant full-screen hand detection powered by **MediaPipe Palm Detection SSD** (192x192).
  - Continuous **CamShift** skin-hue tracking with Adaptive Hue Histogram.
  - Dynamic spring-loaded bounding box (2.0x expanded) rendered on UI Thread at 60 FPS via Reanimated 4.
  - Automatic square crop feeding into MobileNetV2 classification.
- **Configurable Live Detection (Live Mode):**
  - Classic reticle viewfinder with laser sweep animation.
  - Detection speeds:
    - **Fast:** 250ms cadence for real-time responsiveness.
    - **Normal:** 500ms cadence (balanced battery and speed).
    - **Slow:** 1000ms cadence (ideal for beginners).
    - **Manual Trigger:** Capture only upon tapping the scan shutter.
- **Static Image Analysis (Picture Mode):**
  - Choose images from device gallery or capture snapshots.
  - Inspection dialog displaying dimensions, file size, and target model shape before analysis.
- **Sequential Video Analysis (Video Mode):**
  - Select stored videos to automatically extract keyframes at 500ms intervals using `expo-video-thumbnails`.
  - Sequential inference with session summary.
- **Batch Directory Scanning (Batch Mode):**
  - Select entire folders to run batch sign recognition across all image files.
  - Modal results summary listing detected classes and confidences.
- **Dynamic Model Swapping:**
  - Instantly switch active AI models and vocabularies on the fly without app restarts.

---

## 🎓 2. Learning & Testing Hub

- **Curated Model Packs:**
  - Each pack provides its own unique vocabulary set and reference illustrations.
- **Vocabulary Mastery Tracking:**
  - **Learned State:** Words are marked as learned upon meeting detection accuracy thresholds.
  - **Favorites:** Star specific signs for focused repetition.
  - **Progress Gauges:** Live calculation of pack completion percentages.
- **Interactive Flashcards:**
  - 3D card-flip gesture revealing gesture images and phonetic names.
  - Integrated live camera preview to practice signing alongside the card.
  - Support for custom subsets: All, Learned, Unlearned, and Favorites.
- **Practice Verification Mode:**
  - The app challenges you with a specific word; camera verification gives immediate green/red feedback.
- **Gamified Test Suite:**
  - **Time Attack:** Sign as many random words as possible within a 60/120s timer.
  - **Fixed Sprint:** Race through 10 or 20 random words.
  - **Warm-up Countdown:** 3-second positioning window before timer starts.
  - **Post-Test Summary:** Displays final accuracy %, score, time elapsed, and confused words.

---

## 📜 3. Activity History & Session Tracking

- **Timeline Log:** Chronological record of camera sessions, picture analyses, and test scores.
- **Detailed Session View:**
  - Inspect full word sequences, individual confidence percentages, and timestamps.
  - View attached thumbnails for picture/video sessions.
- **Advanced Filtering & Sorting:**
  - Filter by session type (Detection, Learning, Test).
  - Filter by date range, word count, or pack name.

---

## ⚙️ 4. Settings & System Management

- **Theme & Appearance:** Light mode, Dark mode, and System-Adaptive mode.
- **Sound & Voice Engine:**
  - Text-to-Speech (TTS) spoken word cues with adjustable rate and language.
  - Auditory feedback cues for correct/incorrect gestures.
- **Tactile Feedback:** Haptic vibration on successful detection and test milestones.
- **Model Pack Manager:**
  - Import external `.zip` Model Packs via DocumentPicker.
  - Verify and unpack models into isolated sandboxes (`packs/{id}/`).
  - Clean deletion of model folders preventing storage bloat.
- **Diagnostics & Storage:**
  - Built-in **ML Diagnostic Screen** executing 100 sequential inferences to verify model determinism.
  - Cache size calculation and one-tap cache cleaner.
  - Developer Debug Mode overlay displaying real-time FPS, queue length, and tensor dimensions.
- **Internationalization:** Complete Vietnamese (`vi-VN`) and English (`en-US`) localization across all screens and alerts.
