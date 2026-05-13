export const ROUTES = {
  DETECTION: 'Detection',
  LEARNING_TAB: 'LearningTab',
  MODEL_PACKS: 'ModelPacks',
  PACK_DETAIL: 'PackDetail',
  TEST_CONFIG: 'TestConfig',
  PRACTICE: 'Practice',
  TEST: 'Test',
  HISTORY: 'History',
  SETTINGS: 'Settings',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
