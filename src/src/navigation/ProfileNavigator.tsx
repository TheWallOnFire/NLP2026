import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import HistoryDetailScreen from '../features/history/screens/HistoryDetailScreen';
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
        options={{ title: 'Lịch sử' }} 
      />
      <Stack.Screen 
        name={ROUTES.HISTORY_DETAIL} 
        component={HistoryDetailScreen} 
        options={{ title: 'Chi tiết lịch sử' }} 
      />
    </Stack.Navigator>
  );
}
