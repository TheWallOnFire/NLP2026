import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Deep Blue & Ocean Palette
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1A365D', // Deep Navy Blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#D0E4F7', // Soft Ocean Blue
    onPrimaryContainer: '#0A2540',
    
    secondary: '#00B4D8', // Bright Cyan for contrast
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CAF0F8',
    onSecondaryContainer: '#0077B6',
    
    tertiary: '#023E8A', // Medium Deep Blue
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#ADE8F4',
    onTertiaryContainer: '#03045E',
    
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    background: '#F0F4F8', // Very light blue/gray background
    onBackground: '#1A1C1E',
    surface: '#FFFFFF',
    onSurface: '#1A1C1E',
    surfaceVariant: '#DFE2EB',
    onSurfaceVariant: '#43474E',
    outline: '#73777F',
  },
  roundness: 12, // Slightly more rounded for modern soft look
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#48CAE4', // Bright Blue for dark mode contrast
    onPrimary: '#003258',
    primaryContainer: '#03045E', // Deepest Ocean Blue
    onPrimaryContainer: '#D0E4F7',
    
    secondary: '#90E0EF', // Soft glowing cyan
    onSecondary: '#003649',
    secondaryContainer: '#004F69',
    onSecondaryContainer: '#CAF0F8',
    
    tertiary: '#0077B6', // Vibrant Mid-Blue
    onTertiary: '#001D35',
    tertiaryContainer: '#003258',
    onTertiaryContainer: '#ADE8F4',
    
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    
    background: '#0B132B', // Deep Night Blue instead of pure black/gray
    onBackground: '#E2E2E6',
    surface: '#111936', // Slightly lighter deep blue for cards
    onSurface: '#E2E2E6',
    surfaceVariant: '#43474E',
    onSurfaceVariant: '#C3C6CF',
    outline: '#8D9199',
  },
  roundness: 12,
};
