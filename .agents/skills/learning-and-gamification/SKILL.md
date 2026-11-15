---
name: learning-and-gamification
description: >-
  Use this skill when developing, modifying, or testing the learning and gamification
  modules of the NLP2026 app. Covers 3D interactive flashcards, camera gesture verification,
  gamified Test Mode (Time Attack, Fixed Sprint), accuracy metrics, and session history logging.
---

# Learning & Gamification Engine Skill

This skill guides AI agents through modifying and expanding the educational and testing features in `src/src/features/learning/`.

---

## 1. When to Use This Skill
- Modifying interactive flashcard animations or layout in `PracticeWordFlashcardScreen.tsx`.
- Adjusting gesture verification logic in `usePracticeWordLogic.ts` or `usePracticeLogic.ts`.
- Implementing or tuning the gamified **Test Mode** (Time Attack, Fixed Sprint) in `useTestLogic.ts` and `TestScreen.tsx`.
- Integrating test results, accuracy scoring, and confused words into `useHistoryStore.ts`.

---

## 2. Core Modules & Flow

```text
Learning Feature Modules
├── ModelPacksScreen: Overview of downloaded packs and overall progress.
├── PackDetailScreen: Word lists, favorite bookmarks, and navigation to practice.
├── PracticeWordSetupScreen: Select range (All, Learned, Unlearned, Favorites) and card count.
├── PracticeWordFlashcardScreen: 3D flip card with sign image and camera verification.
├── PracticeScreen: Free-form camera practice against single target words.
├── TestConfigScreen: Configure mode (Time Attack vs Fixed Sprint) and duration/quota.
└── TestScreen: Active gamified challenge with warm-up countdown and score counter.
```

---

## 3. Test Mode Implementation Details

Managed by `useTestLogic.ts`:
- **Warm-up Timer:** A 3-second countdown gives the user time to position their hands before the clock starts.
- **Time Drift Prevention:** Instead of decrementing interval ticks, calculates remaining time from `testEndTimeRef = Date.now() + duration * 1000`.
- **Transition Safety:** Stores `transitionTimeoutRef` to cancel in-flight transitions on unmount or re-trigger.
- **Temporary Cache Cleanup:** Camera snapshots are purged in `finally` blocks via `FileSystem.deleteAsync`.
- **Gesture Verification:** When a gesture matches `currentWord.word` with `confidence >= threshold`:
  - Triggers success haptic (`triggerSuccessFeedback`).
  - Increments score and advances to a non-repeating random next word.
- **Session Auto-Save:** When time expires, logs the session to `useHistoryStore`:
  ```typescript
  addHistoryItem({
    sign: `Test Session: ${packName}`,
    packId,
    mode: 'test',
    type: 'test',
    testStats: { score, total: testResults.length, duration },
    testResults
  });
  ```

See [test_modes_specs.md](./references/test_modes_specs.md) for full specifications.
