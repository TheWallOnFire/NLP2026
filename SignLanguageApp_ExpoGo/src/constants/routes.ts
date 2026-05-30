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
  PROFILE_TAB: 'ProfileTab',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
