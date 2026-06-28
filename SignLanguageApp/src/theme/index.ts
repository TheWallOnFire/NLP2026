import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Professional Material 3 Palette (Deep Blue & Slate)
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0A56D9', // Professional Deep Blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#D8E2FF',
    onPrimaryContainer: '#001A41',
    
    secondary: '#10B981', // Emerald Success
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D1FAE5',
    onSecondaryContainer: '#064E3B',
    
    tertiary: '#705575', // Elegant Purple Gray
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FAD8FD',
    onTertiaryContainer: '#29132E',
    
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    background: '#F8FAFC', // Slate 50
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceVariant: '#E2E8F0', // Slate 200
    onSurfaceVariant: '#475569',
    outline: '#94A3B8', // Slate 400
  },
  roundness: 3,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ADC6FF', // Light Blue for Dark Mode
    onPrimary: '#002E69',
    primaryContainer: '#00408F',
    onPrimaryContainer: '#D8E2FF',
    
    secondary: '#34D399', // Bright Emerald
    onSecondary: '#022C22',
    secondaryContainer: '#065F46',
    onSecondaryContainer: '#D1FAE5',
    
    tertiary: '#DDBCE0',
    onTertiary: '#3F2844',
    tertiaryContainer: '#573E5C',
    onTertiaryContainer: '#FAD8FD',
    
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    
    background: '#0F172A', // Slate 900
    onBackground: '#F8FAFC',
    surface: '#1E293B', // Slate 800
    onSurface: '#F8FAFC',
    surfaceVariant: '#334155', // Slate 700
    onSurfaceVariant: '#CBD5E1',
    outline: '#64748B', // Slate 500
  },
  roundness: 3,
};
