export const ROUTES = {
  DETECTION: 'Detection',
  LEARNING: 'Learning',
  HISTORY: 'History',
  SETTINGS: 'Settings',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
