import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from './src/features/settings/store/useSettingsStore';
import { lightTheme, darkTheme } from './src/theme';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, LogBox } from 'react-native';

LogBox.ignoreLogs(['Expo AV has been deprecated']);

import LoadingScreen from './src/features/common/screens/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
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

    // Simulate AI Engine loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearTimeout(timer);
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

