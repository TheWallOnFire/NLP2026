# Comprehensive Feature List

This document provides a detailed catalog of the features implemented in the **Sign Language Detector** application.

---

## 🔍 1. Vision & Detection

- **Autonomous Hand Tracking (Auto Mode - Default):**
  - Instant full-screen hand detection powered by **MediaPipe Palm Detection SSD** (192x192).
  - Continuous **CamShift** skin-hue tracking with Adaptive Hue Histogram.
  - Dynamic spring-loaded bounding box (1.5x/2.0x expanded) rendered on UI Thread at 60 FPS.
- **Configurable Live Detection:**
  - **Fast:** Instantaneous classification on captured frames.
  - **Normal:** 1-second cadence (recommended balance for battery and responsiveness).
  - **Slow:** 3-second cadence (ideal for beginners).
  - **Manual Trigger:** Capture only upon tapping the scan shutter.
- **Static Image Analysis (Picture Mode):**
  - Choose images from device gallery or capture snapshots.
  - Inspection dialog displaying dimensions, file size, and target model shape before analysis.
- **Sequential Video Analysis (Video Mode):**
  - Select stored videos to automatically extract keyframes at 500ms intervals.
  - Sequential inference with session summary.
- **Batch Directory Scanning (Batch Mode):**
  - Select entire folders to run batch sign recognition across all image files.
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
- **Practice Verification Mode:**
  - The app challenges you with a specific word; snapshot verification gives immediate green/red feedback.
- **Gamified Test Suite:**
  - **Time Attack:** Sign as many random words as possible within a 60/120s timer.
  - **Fixed Sprint:** Race through 10 or 20 random words.
  - **Post-Test Summary:** Displays final accuracy %, score, time elapsed, and confused words.

---

## 📜 3. Activity History & Session Tracking

- **Timeline Log:** Chronological record of camera sessions, picture analyses, and test scores.
- **Detailed Session View:**
  - Inspect full word sequences, individual confidence percentages, and timestamps.
  - View attached thumbnails for picture/video sessions.
- **Advanced Filtering & Sorting:**
  - Filter by session type (Detection, Learning, Test).
  - Sort by date, word count, or pack name.

---

## ⚙️ 4. Settings & System Management

- **Theme & Appearance:** Light mode, Dark mode, and System-Adaptive mode.
- **Sound & Voice Engine:**
  - Text-to-Speech (TTS) spoken word cues with adjustable rate and language.
  - Auditory feedback cues for correct/incorrect gestures.
- **Tactile Feedback:** Haptic vibration on successful detection and test milestones.
- **Model Pack Manager:**
  - Import external `.zip` Model Packs via DocumentPicker.
  - Verify and unpack models into isolated sandboxes.
  - Clean deletion of model folders preventing storage bloat.
- **Diagnostics & Storage:**
  - Built-in **ML Diagnostic Screen** executing 100 sequential inferences to verify model determinism.
  - Cache size calculation and one-tap cache cleaner.
  - Factory reset to safely clear all local databases.
- **Internationalization:** Complete Vietnamese (`vi-VN`) and English (`en-US`) localization.
