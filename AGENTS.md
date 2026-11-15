# AI Agent Guidelines & Project Map — NLP2026

Welcome to the **NLP2026 Sign Language Detector** repository. This document provides core architectural rules, conventions, and links to specialized workspace skills for AI agents assisting with this project.

---

## 🧰 Available Project Skills (`.agents/skills/`)

Specialized runbooks and guides are available under `.agents/skills/`. AI agents should activate and consult these skills when working on relevant domains:

| Skill | Directory | Purpose |
| :--- | :--- | :--- |
| **`asl-model-packaging`** | [`.agents/skills/asl-model-packaging/`](file:///d:/VScode/NLP2026/.agents/skills/asl-model-packaging/SKILL.md) | Converting Keras models to TFLite Model Packs (`.zip`), vocabulary schemas, and metadata formatting. |
| **`asl-model-evaluation`** | [`.agents/skills/asl-model-evaluation/`](file:///d:/VScode/NLP2026/.agents/skills/asl-model-evaluation/SKILL.md) | Running the Python AI benchmark suite in `tests/`, measuring accuracy, confusion matrices, and inspecting tensor shapes (supports `--all` and `--run`). |
| **`mobile-app-development`** | [`.agents/skills/mobile-app-development/`](file:///d:/VScode/NLP2026/.agents/skills/mobile-app-development/SKILL.md) | Developing, configuring, and building the React Native (Expo SDK 54) app with native Nitro modules, VisionCamera v5, and ErrorBoundary. |
| **`hand-tracking-detection-pipeline`** | [`.agents/skills/hand-tracking-detection-pipeline/`](file:///d:/VScode/NLP2026/.agents/skills/hand-tracking-detection-pipeline/SKILL.md) | Debugging and tuning the real-time dual-loop detection pipeline (MediaPipe Palm SSD + CamShift + MobileNetV2). |
| **`model-pack-management`** | [`.agents/skills/model-pack-management/`](file:///d:/VScode/NLP2026/.agents/skills/model-pack-management/SKILL.md) | Managing `.zip` Model Pack sandboxing (`packs/{id}/`), JSZip extraction, zero-storage-bloat uninstallation, and cache purging. |
| **`learning-and-gamification`** | [`.agents/skills/learning-and-gamification/`](file:///d:/VScode/NLP2026/.agents/skills/learning-and-gamification/SKILL.md) | Educational flashcards (3D flip), real-time camera gesture matching, and gamified Test Modes (Time Attack, Fixed Sprint). |
| **`code-review`** | [`.agents/skills/code-review/`](file:///d:/VScode/NLP2026/.agents/skills/code-review/SKILL.md) | Standardized, rigorous 5-phase procedural code review covering correctness, concurrency, memory, security, and mobile performance. |

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

4. **Execution Safety & Blocking Commands:**
   - Never run blocking installation/dev commands (e.g. `pip install`, `npm install`, `tsc`, `npx expo start`) without user confirmation. Guide the user to run them in their terminal.

5. **Sandboxed Pack Deletion & Cache Policy:**
   - Whenever deleting a model pack, always wipe the dedicated sandbox directory `${FileSystem.documentDirectory}packs/${packId}/` to prevent local storage bloat, reset `activePackId: null`, and remove vocabulary via `removePackWords()`.
   - Always purge temporary camera snapshots and cropped image buffers in `finally` blocks.

6. **ArrayBuffer Memory Sharing & Typed Arrays:**
   - Fast-TFLite output buffers shared across JSI must be accessed with explicit `byteOffset` and integer-aligned length (`Math.floor(byteLength / 4)`).

7. **FileSystem Legacy Compatibility:**
   - Always import FileSystem from `expo-file-system/legacy` across the React Native codebase to maintain forward compatibility with Expo SDK 54.

---

## 📚 Documentation Map

The repository's documentation is organized under [`doc/`](file:///d:/VScode/NLP2026/doc/README.md):
- [**`architecture_and_pipeline.md`**](file:///d:/VScode/NLP2026/doc/architecture_and_pipeline.md): Comprehensive system architecture, C4 container topology, Dual-Loop pipeline, and memory layout.
- [**`troubleshooting_and_faq.md`**](file:///d:/VScode/NLP2026/doc/troubleshooting_and_faq.md): Developer FAQ, build troubleshooting, Metro caching, and runtime edge-case mitigations.
- [**`design.md`**](file:///d:/VScode/NLP2026/doc/design.md): System technical design, C4 Level 1 & Level 2 diagrams, data schemas, and Architecture Decision Records (ADRs).
- [**`proposal.md`**](file:///d:/VScode/NLP2026/doc/proposal.md): Problem statement, objectives, target audience, scope, and risk mitigations.
- [**`tech_stack.md`**](file:///d:/VScode/NLP2026/doc/tech_stack.md): Detailed tech stack inventory for Mobile, Native C++, and Python environments.
- [**`src/docs/`**](file:///d:/VScode/NLP2026/src/docs/index.md): Mobile app internal companion docs covering camera hardware, ML pipeline worklets, feature catalogs, and bug logs.
