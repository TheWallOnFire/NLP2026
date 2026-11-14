# Architecture & State Management

## Project Structure

The mobile application follows a feature-driven, domain-separated folder structure located under `src/src/`:

```text
src/
├── assets/                     # Default static assets & bundled TFLite models
│   └── models/palm_detection.tflite
├── src/                        # Modular source code
│   ├── components/             # App-wide reusable UI components (e.g. ErrorBoundary)
│   ├── constants/              # Navigation routes and global constants
│   ├── core/                   # i18n localization resources (en, vi)
│   ├── features/               # Feature domain modules
│   │   ├── common/             # Shared screens (Loading/Splash)
│   │   ├── dashboard/          # Home dashboard, streak tracker & quick actions
│   │   ├── detection/          # Live vision, auto-mode tracking, TFLite inference
│   │   ├── history/            # Session history timelines and detail cards
│   │   ├── learning/           # Model packs, flashcards, practice & test engines
│   │   ├── profile/            # User profile, statistics, and preferences
│   │   └── settings/           # App configuration, storage & model pack manager
│   ├── navigation/             # Bottom tab & stack navigators (React Navigation)
│   ├── theme/                  # Material Design 3 light & dark theme definitions
│   └── utils/                  # Feedback (haptics/audio) and ZIP pack importer
├── app.json                    # Expo project configuration
├── App.tsx                     # Root component, theme provider & app lifecycle
└── package.json                # Project dependencies and build scripts
```

---

## State Management

Global state is managed via **Zustand** stores, coupled with `AsyncStorage` via the `persist` middleware for seamless offline persistence.

### Core Stores

1. **`useSettingsStore`** (`src/src/features/settings/store/useSettingsStore.ts`):
   - Manages app theme (Light, Dark, Mixed), active language (`en`, `vi`), audio/TTS settings, camera facing preference, and developer debug mode.
   
2. **`useModelStore`** (`src/src/features/learning/store/useModelStore.ts`):
   - Tracks installed Model Packs, the currently active pack ID, custom model URIs, and manages sandboxed pack deletion.

3. **`useLearningStore`** (`src/src/features/learning/store/useLearningStore.ts`):
   - Maintains vocabulary lists for each pack, tracking learned word state, favorite bookmarks, and completion progress percentages.

4. **`useHistoryStore`** (`src/src/features/history/store/useHistoryStore.ts`):
   - Stores activity logs across camera detection sessions, image/video analysis, and gamified test scores.

5. **`useUserStore`** (`src/src/features/profile/store/useUserStore.ts`):
   - Manages user profile details, daily streaks, total practice time, and user level metrics.

---

## Navigation Architecture

Navigation is powered by **React Navigation v7**:
- **`AppNavigator.tsx`**: The top-level controller housing the bottom tab bar (Detection, Learning, Home Dashboard, Profile, Settings) and detail stack routes (`History`, `HistoryDetail`).
- **Headerless Screen Layouts**: Standard React Navigation headers are disabled (`headerShown: false`) in favor of bespoke, theme-aware appbars on each screen.
- **Safe Area Insets**: Edge-to-edge rendering handled with `react-native-safe-area-context` on individual screen views.
