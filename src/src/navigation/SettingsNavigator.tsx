import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import ModelManagerScreen from '../features/settings/screens/ModelManagerScreen';
// @ts-ignore
import MLDiagnosticScreen from '../features/detection/screens/MLDiagnosticScreen';
import { ROUTES } from '../constants/routes';
import { useTheme } from 'react-native-paper';
// Trigger IDE cache refresh

const Stack = createNativeStackNavigator();

export default function SettingsNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen 
        name={ROUTES.SETTINGS} 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
      <Stack.Screen 
        name={ROUTES.MODEL_MANAGER} 
        component={ModelManagerScreen} 
        options={{ title: 'Model Pack Manager' }} 
      />
      <Stack.Screen 
        name={ROUTES.ML_DIAGNOSTIC} 
        component={MLDiagnosticScreen} 
        options={{ title: 'ML Diagnostic Tool' }} 
      />
    </Stack.Navigator>
  );
}
