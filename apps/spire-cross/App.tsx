import React from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './src/state/GameContext';
import HomeScreen from './src/screens/HomeScreen';
import DungeonScreen from './src/screens/DungeonScreen';
import StoryScreen from './src/screens/StoryScreen';
import CharactersScreen from './src/screens/CharactersScreen';
import GachaScreen from './src/screens/GachaScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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
  ダンジョン: '🗺️',
  ストーリー: '📖',
  キャラ: '👥',
  ガチャ: '🎰',
  設定: '⚙️',
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
              tabBarIcon: () => <Text style={{ fontSize: 16 }}>{TAB_ICON[route.name] ?? ''}</Text>,
              tabBarLabel: route.name,
              tabBarLabelStyle: { fontSize: 9.5 },
              tabBarItemStyle: { paddingVertical: 2 },
            })}
          >
            <Tab.Screen name="ホーム" component={HomeScreen} />
            <Tab.Screen name="ダンジョン" component={DungeonScreen} />
            <Tab.Screen name="ストーリー" component={StoryScreen} />
            <Tab.Screen name="キャラ" component={CharactersScreen} />
            <Tab.Screen name="ガチャ" component={GachaScreen} />
            <Tab.Screen name="設定" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </GameProvider>
    </SafeAreaProvider>
  );
}
