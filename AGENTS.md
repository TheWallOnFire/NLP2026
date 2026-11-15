# AI Agent Guidelines & Project Map — NLP2026

Welcome to the **NLP2026 Sign Language Detector** repository. This document provides core architectural rules, conventions, and links to specialized workspace skills for AI agents assisting with this project.

---

## 🧰 Available Project Skills (`.agents/skills/`)

Specialized runbooks and guides are available under `.agents/skills/`. AI agents should activate and consult these skills when working on relevant domains:

| Skill | Directory | Purpose |
| :--- | :--- | :--- |
| **`asl-model-packaging`** | `.agents/skills/asl-model-packaging/` | Converting Keras models to TFLite Model Packs (`.zip`), vocabulary schemas, and metadata formatting. |
| **`asl-model-evaluation`** | `.agents/skills/asl-model-evaluation/` | Running the Python AI benchmark suite in `tests/`, measuring accuracy, confusion matrices, and inspecting tensor shapes. |
| **`mobile-app-development`** | `.agents/skills/mobile-app-development/` | Developing, configuring, and building the React Native (Expo SDK 54) app with native Nitro modules and VisionCamera v5. |
| **`hand-tracking-detection-pipeline`** | `.agents/skills/hand-tracking-detection-pipeline/` | Debugging and tuning the real-time dual-loop detection pipeline (MediaPipe SSD + CamShift + MobileNetV2). |
| **`model-pack-management`** | `.agents/skills/model-pack-management/` | Managing `.zip` Model Pack sandboxing (`packs/{id}/`), JSZip extraction, and zero-storage-bloat uninstallation. |
| **`learning-and-gamification`** | `.agents/skills/learning-and-gamification/` | Educational flashcards, real-time gesture matching, and gamified Test Modes (Time Attack, Fixed Sprint). |
| **`code-review`** | `.agents/skills/code-review/` | Standardized, rigorous procedural code reviews covering correctness, concurrency, memory, security, and mobile performance. |

---

## ⚠️ Critical Architectural Rules

1. **Native C++ Architecture (Not Vanilla Expo Go):**
   - The app uses `react-native-fast-tflite`, `react-native-nitro-modules`, `react-native-nitro-image`, and `react-native-vision-camera`.
   - These native C++ libraries **cannot** run in standard Expo Go. Always instruct users to build with **Expo Prebuild** (`npx expo prebuild --clean` + `npx expo run:android`) or **EAS Build**.

2. **No Hardcoded Machine Paths:**
   - Never commit hardcoded Windows drive paths (e.g. `d:/NLP2026/...`).
   - Derive paths dynamically using `os.path.dirname(...)` in Python or relative imports in TypeScript.

3. **Color Normalization Consistency:**
   - MobileNetV2 ASL and MediaPipe Palm models expect pixels normalized to `[0, 1]`.
   - Never normalize Palm Detection inputs to `[-1, 1]` as it causes exploding activations and ghost detections.

4. **Execution Safety:**
   - Never invoke blocking installation commands (e.g. `pip install`, `npm install`, `tsc`, `npx expo start`) without user confirmation. Guide the user to run them in their terminal.

5. **Sandboxed Pack Deletion:**
   - Whenever deleting a model pack, always wipe the dedicated sandbox directory `${FileSystem.documentDirectory}packs/${packId}/` to prevent local storage bloat.
