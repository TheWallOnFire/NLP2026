import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Camera, BookOpen, Clock, Settings as SettingsIcon } from 'lucide-react-native';

import DetectionScreen from '../features/detection/screens/DetectionScreen';
import LearningScreen from '../features/learning/screens/LearningScreen';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="Detection" 
          component={DetectionScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name="Learning" 
          component={LearningScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
