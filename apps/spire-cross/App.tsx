import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './src/state/GameContext';
import HomeScreen from './src/screens/HomeScreen';
import GachaScreen from './src/screens/GachaScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import RunScreen from './src/screens/RunScreen';

const Tab = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#12121a',
    card: '#1c1c26',
    border: '#2a2a35',
    primary: '#3f8efc',
  },
};

const TAB_ICON: Record<string, string> = {
  ホーム: '🏠',
  ガチャ: '🎰',
  コレクション: '📖',
  冒険: '🗺️',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer theme={theme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#3f8efc',
              tabBarInactiveTintColor: '#6b6b80',
              tabBarStyle: { backgroundColor: '#1c1c26', borderTopColor: '#2a2a35' },
              tabBarIcon: () => null,
              tabBarLabel: `${TAB_ICON[route.name] ?? ''} ${route.name}`,
            })}
          >
            <Tab.Screen name="ホーム" component={HomeScreen} />
            <Tab.Screen name="ガチャ" component={GachaScreen} />
            <Tab.Screen name="コレクション" component={CollectionScreen} />
            <Tab.Screen name="冒険" component={RunScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </GameProvider>
    </SafeAreaProvider>
  );
}
