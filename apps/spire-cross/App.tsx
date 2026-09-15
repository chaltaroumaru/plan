import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

// react-native-screens は web では screensEnabled() が既定で false になり、
// 非表示タブの display:none が効かず前の画面が透けて見えるため、明示的に有効化する。
enableScreens();
import { GameProvider } from './src/state/GameContext';
import AppBackground, { THEME } from './src/components/AppBackground';
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
    background: 'transparent',
    card: 'rgba(20,15,40,0.9)',
    border: 'rgba(124,92,255,0.25)',
    primary: THEME.violet,
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
    <View style={styles.root}>
      <AppBackground />
      <SafeAreaProvider>
        <GameProvider>
          <NavigationContainer theme={theme}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: THEME.gold,
                tabBarInactiveTintColor: '#8a80b0',
                tabBarStyle: {
                  backgroundColor: 'rgba(15,11,32,0.92)',
                  borderTopColor: 'rgba(124,92,255,0.25)',
                },
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bgBottom },
});
