import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import { ROUTES } from '../constants/routes';
import { useTheme } from 'react-native-paper';

const Stack = createNativeStackNavigator();

export default function ProfileNavigator() {
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
        name={ROUTES.PROFILE} 
        component={ProfileScreen} 
        options={{ title: 'Profile' }} 
      />
      <Stack.Screen 
        name={ROUTES.HISTORY} 
        component={HistoryScreen} 
        options={{ title: 'Learning History' }} 
      />
    </Stack.Navigator>
  );
}
