import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { Camera, BookOpen, Clock, Settings as SettingsIcon } from 'lucide-react-native';

import DetectionScreen from '../features/detection/screens/DetectionScreen';
import LearningNavigator from './LearningNavigator';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import { ROUTES } from '../constants/routes';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.outline,
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        }}
      >
        <Tab.Screen 
          name={ROUTES.DETECTION} 
          component={DetectionScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name={ROUTES.LEARNING_TAB} 
          component={LearningNavigator} 
          options={{
            title: 'Learning',
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name={ROUTES.HISTORY} 
          component={HistoryScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name={ROUTES.SETTINGS} 
          component={SettingsScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
