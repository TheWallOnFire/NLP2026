import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ModelPacksScreen from '../features/learning/screens/ModelPacksScreen';
import PackDetailScreen from '../features/learning/screens/PackDetailScreen';
import PracticeScreen from '../features/learning/screens/PracticeScreen';
import TestConfigScreen from '../features/learning/screens/TestConfigScreen';
import TestScreen from '../features/learning/screens/TestScreen';
import { ROUTES } from '../constants/routes';
import { useTheme } from 'react-native-paper';

const Stack = createNativeStackNavigator();

export default function LearningNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen
        name={ROUTES.MODEL_PACKS}
        component={ModelPacksScreen}
        options={{ title: 'Sign Language Packs' }}
      />
      <Stack.Screen
        name={ROUTES.PACK_DETAIL}
        component={PackDetailScreen}
        options={{ headerShown: false }} // Custom header in screen
      />
      <Stack.Screen
        name={ROUTES.PRACTICE}
        component={PracticeScreen}
        options={{ headerShown: false }} // Custom header in screen
      />
      <Stack.Screen
        name={ROUTES.TEST_CONFIG}
        component={TestConfigScreen}
        options={{ headerShown: false }} // Custom header in screen
      />
      <Stack.Screen
        name={ROUTES.TEST}
        component={TestScreen}
        options={{ title: 'Vocabulary Test' }}
      />
    </Stack.Navigator>
  );
}
