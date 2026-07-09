export const ROUTES = {
  DASHBOARD: 'Dashboard',
  DETECTION: 'Detection',
  LEARNING_TAB: 'LearningTab',
  MODEL_PACKS: 'ModelPacks',
  PACK_DETAIL: 'PackDetail',
  TEST_CONFIG: 'TestConfig',
  PRACTICE: 'Practice',
  TEST: 'Test',
  HISTORY: 'History',
  HISTORY_DETAIL: 'HistoryDetail',
  PROFILE_TAB: 'ProfileTab',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  MODEL_MANAGER: 'ModelManager',
  PRACTICE_WORD_SETUP: 'PracticeWordSetup',
  PRACTICE_WORD_FLASHCARD: 'PracticeWordFlashcard',
  ML_DIAGNOSTIC: 'MLDiagnostic',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
