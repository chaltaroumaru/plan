import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import ShopScreen from './src/screens/ShopScreen';
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

const TAB_BAR_CONTENT_HEIGHT = 78;

function AppNavigator() {
  // 端末のジェスチャーバー/ナビゲーションボタン分の余白(bottom inset)を
  // タブバーの高さに足すことで、OSのナビゲーションUIと重ならないようにする。
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: THEME.gold,
          tabBarInactiveTintColor: '#8a80b0',
          tabBarStyle: {
            backgroundColor: 'rgba(15,11,32,0.95)',
            borderTopColor: 'rgba(124,92,255,0.25)',
            height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
            paddingTop: 10,
            paddingBottom: insets.bottom,
          },
          tabBarIcon: () => <Text style={{ fontSize: 30 }}>{TAB_ICON[route.name] ?? ''}</Text>,
          tabBarLabel: route.name,
          tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
          tabBarItemStyle: { paddingVertical: 4 },
        })}
      >
        <Tab.Screen name="ホーム" component={HomeScreen} />
        <Tab.Screen name="ダンジョン" component={DungeonScreen} />
        <Tab.Screen name="ストーリー" component={StoryScreen} />
        <Tab.Screen name="キャラ" component={CharactersScreen} />
        <Tab.Screen name="ガチャ" component={GachaScreen} />
        {/* ホーム画面の屋台をタップして入る場所のため、下部タブバーには出さない */}
        <Tab.Screen name="ショップ" component={ShopScreen} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="設定" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={styles.outer}>
      <View style={styles.frame}>
        <AppBackground />
        <SafeAreaProvider>
          <GameProvider>
            <AppNavigator />
            <StatusBar style="light" />
          </GameProvider>
        </SafeAreaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  // スマホ画面比率にレターボックスすることで、PCの横長ウィンドウでも
  // 背景イラストのクロップ位置がスマホと揃うようにする
  frame: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: THEME.bgBottom },
});
