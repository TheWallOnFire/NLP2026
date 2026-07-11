import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { LayoutGrid, Camera, BookOpen, User, Settings as SettingsIcon, Video } from 'lucide-react-native';

import DetectionScreen from '../features/detection/screens/DetectionScreen';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import LearningNavigator from './LearningNavigator';
import ProfileNavigator from './ProfileNavigator';
import SettingsNavigator from './SettingsNavigator';
import { ROUTES } from '../constants/routes';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import HistoryDetailScreen from '../features/history/screens/HistoryDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.DASHBOARD}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          height: 65,
          paddingBottom: 15,
          paddingTop: 5,
        },
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
          headerShown: false,
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate(ROUTES.LEARNING_TAB, { screen: ROUTES.MODEL_PACKS });
          },
        })}
      />
      <Tab.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutGrid
              color={color}
              size={focused ? size + 6 : size + 2}
              strokeWidth={focused ? 3 : 2}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE_TAB}
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate(ROUTES.PROFILE_TAB, { screen: ROUTES.PROFILE });
          },
        })}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name={ROUTES.HISTORY} component={HistoryScreen} />
          <Stack.Screen name={ROUTES.HISTORY_DETAIL} component={HistoryDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}
