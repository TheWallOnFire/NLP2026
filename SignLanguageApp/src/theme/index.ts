import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4361EE', // Modern vibrant blue
    primaryContainer: '#D0D6FF',
    secondary: '#F72585', // Accent pink
    secondaryContainer: '#FFD4E4',
    tertiary: '#4CC9F0', // Cyan accent
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#E2E8F0',
    outline: '#CBD5E1',
    error: '#EF4444',
  },
  roundness: 3, // Multiplier for MD3 border radius (creates rounder corners)
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4CC9F0',
    primaryContainer: '#004B6B',
    secondary: '#F72585',
    secondaryContainer: '#7A0033',
    tertiary: '#4361EE',
    background: '#0F172A', // Slate 900
    surface: '#1E293B', // Slate 800
    surfaceVariant: '#334155', // Slate 700
    outline: '#475569',
    error: '#EF4444',
  },
  roundness: 3,
};
