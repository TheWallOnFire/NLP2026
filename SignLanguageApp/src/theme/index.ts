import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Futuristic Sci-Fi Palette (Neon Blue, Cyan, Violet)
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB', // Futuristic Blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#DBEAFE',
    onPrimaryContainer: '#1E3A8A',
    
    secondary: '#06B6D4', // Cyber Cyan
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CFFAFE',
    onSecondaryContainer: '#164E63',
    
    tertiary: '#8B5CF6', // Tech Violet
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#EDE9FE',
    onTertiaryContainer: '#4C1D95',
    
    error: '#EF4444',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#7F1D1D',
    
    background: '#F8FAFC', // Slate 50
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceVariant: '#E2E8F0', // Slate 200
    onSurfaceVariant: '#475569',
    outline: '#94A3B8', // Slate 400
  },
  roundness: 8, // More rounded for modern look
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6', // Glowing Blue
    onPrimary: '#EFF6FF',
    primaryContainer: '#1D4ED8',
    onPrimaryContainer: '#BFDBFE',
    
    secondary: '#22D3EE', // Neon Cyan
    onSecondary: '#083344',
    secondaryContainer: '#0891B2',
    onSecondaryContainer: '#CFFAFE',
    
    tertiary: '#A78BFA', // Neon Violet
    onTertiary: '#2E1065',
    tertiaryContainer: '#6D28D9',
    onTertiaryContainer: '#EDE9FE',
    
    error: '#F87171',
    onError: '#450A0A',
    errorContainer: '#991B1B',
    onErrorContainer: '#FEE2E2',
    
    background: '#020617', // Deep Space Void
    onBackground: '#F8FAFC',
    surface: '#0F172A', // Slate 900
    onSurface: '#F8FAFC',
    surfaceVariant: '#1E293B', // Slate 800
    onSurfaceVariant: '#CBD5E1',
    outline: '#64748B', // Slate 500
  },
  roundness: 8,
};
