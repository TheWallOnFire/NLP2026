import * as React from 'react';
import './src/core/i18n';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from './src/features/settings/store/useSettingsStore';
import { lightTheme, darkTheme } from './src/theme';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, LogBox, useColorScheme, AppState } from 'react-native';

import LoadingScreen from './src/features/common/screens/LoadingScreen';

import * as FileSystem from 'expo-file-system';
import { useUserStore } from './src/features/profile/store/useUserStore';

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore((state) => state.theme);
  
  const isDarkMode = themePreference === 'dark' || (themePreference === 'mixed' && systemColorScheme === 'dark');
  const theme = isDarkMode ? darkTheme : lightTheme;

  React.useEffect(() => {
    // 1. Streak tracking (daily app open logic)
    const { profile } = useUserStore.getState();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (profile.lastOpenedDate !== todayStr) {
      let newStreak = profile.streakDays || 0;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      if (profile.lastOpenedDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      useUserStore.getState().updateProfile({ lastOpenedDate: todayStr, streakDays: newStreak });
    }

    // 2. App Usage Time Tracking (minutes)
    let activeStartTime = Date.now();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        activeStartTime = Date.now();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        const timeSpentMinutes = (Date.now() - activeStartTime) / 60000;
        const currentTotal = useUserStore.getState().profile.learningTime || 0;
        useUserStore.getState().updateProfile({ learningTime: currentTotal + timeSpentMinutes });
      }
    });

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        const currentTotal = useUserStore.getState().profile.learningTime || 0;
        useUserStore.getState().updateProfile({ learningTime: currentTotal + 1 });
        activeStartTime = Date.now(); // reset start time to prevent double counting
      }
    }, 60000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

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

