# Architecture & State Management

## Project Structure
The `SignLanguageApp_ExpoGo` project follows a feature-based folder structure under the `src/` directory, which promotes modularity and separation of concerns.

```text
src/
├── features/
│   ├── detection/    # Camera view and ML inference/mock logic
│   ├── history/      # Logs and timelines of past translation sessions
│   ├── learning/     # Custom model loader and practice features
│   └── profile/      # User settings, preferences, and profile UI
├── navigation/       # Tab and Stack navigators (React Navigation)
└── utils/            # Helper functions (e.g., feedback, haptics, formatting)
```

## State Management
We use **Zustand** for global state management because of its lightweight nature and minimal boilerplate. The stores are typically configured to persist data locally using `AsyncStorage`.

### Core Stores
1. **`useUserStore`** (`src/features/profile/store/useUserStore.ts`):
   - Manages user profile details, experience points, current level, and settings (theme, haptics).
   - This ensures the Profile page and other UI elements instantly react to preference changes.
   
2. **`useModelStore`** (`src/features/learning/store/useModelStore.ts`):
   - Keeps track of the currently active `.tflite` model pack.
   - Saves the URI of custom user-selected models across app restarts.
   
3. **`useHistoryStore`**:
   - Stores the chronological log of previous detections, which feeds into the Activity History timeline.

## Navigation
The app relies on **React Navigation**.
- **`AppNavigator.tsx`**: The root controller that manages the primary Bottom Tab Navigation. It is wrapped in a `SafeAreaView` to ensure UI elements respect device notches and status bars natively.
- **Headerless Design**: To provide a modern and immersive experience, all standard React Navigation headers are disabled (`headerShown: false`). Custom, inline UI headers are used directly within each screen.
