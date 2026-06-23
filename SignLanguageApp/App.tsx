import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from './src/features/settings/store/useSettingsStore';
import { lightTheme, darkTheme } from './src/theme';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, LogBox, useColorScheme } from 'react-native';

import LoadingScreen from './src/features/common/screens/LoadingScreen';

import * as FileSystem from 'expo-file-system/legacy';

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore((state) => state.theme);
  
  const isDarkMode = themePreference === 'dark' || (themePreference === 'mixed' && systemColorScheme === 'dark');
  const theme = isDarkMode ? darkTheme : lightTheme;

  React.useEffect(() => {
    let listener: any;
    
    // Hide navigation bar on Android and auto-hide if it becomes visible
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      
      listener = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === 'visible') {
          setTimeout(() => {
            NavigationBar.setVisibilityAsync('hidden');
          }, 3000);
        }
      });
    }

    // Clean cache and Simulate AI Engine loading
    const initApp = async () => {
      try {
        const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir) {
          const files = await FileSystem.readDirectoryAsync(cacheDir);
          for (const file of files) {
            if (file.startsWith('crop_') || file.startsWith('media_')) {
              await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
            }
          }
        }
        
        // Dọn dẹp Image Cache (Fresco) tránh OOM Heap (Bug 2)
        // @ts-ignore
        import('expo-image').then(({ Image }) => {
          Image.clearMemoryCache();
          Image.clearDiskCache();
        }).catch(() => {});
        
      } catch (e) {
        console.warn("Failed to clean cache", e);
      }
      setTimeout(() => setIsLoading(false), 2500);
    };
    initApp();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

