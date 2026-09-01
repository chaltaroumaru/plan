import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/components/ui';
import DashboardScreen from './src/screens/DashboardScreen';
import AnniversaryScreen from './src/screens/AnniversaryScreen';
import GiftScreen from './src/screens/GiftScreen';
import CosmeticsScreen from './src/screens/CosmeticsScreen';
import LikesScreen from './src/screens/LikesScreen';
import PeriodScreen from './src/screens/PeriodScreen';
import { requestNotificationPermission } from './src/notifications/scheduler';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.card,
    border: COLORS.border,
    primary: COLORS.primary,
    text: COLORS.text,
  },
};

const TAB_ICON: Record<string, string> = {
  ホーム: '🏠',
  記念日: '🎉',
  プレゼント: '🎁',
  化粧品: '💄',
  好きなもの: '💭',
  生理管理: '🩷',
};

const TAB_LABEL: Record<string, string> = {
  ホーム: 'ホーム',
  記念日: '記念日',
  プレゼント: 'プレゼント',
  化粧品: '化粧品',
  好きなもの: '好み',
  生理管理: '生理',
};

export default function App() {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: COLORS.primaryDark,
            tabBarInactiveTintColor: '#c7a8b0',
            tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
            tabBarIcon: () => <Text style={{ fontSize: 16 }}>{TAB_ICON[route.name] ?? ''}</Text>,
            tabBarLabel: TAB_LABEL[route.name] ?? route.name,
            tabBarLabelStyle: { fontSize: 9.5 },
            tabBarItemStyle: { paddingVertical: 2 },
          })}
        >
          <Tab.Screen name="ホーム" component={DashboardScreen} />
          <Tab.Screen name="記念日" component={AnniversaryScreen} />
          <Tab.Screen name="プレゼント" component={GiftScreen} />
          <Tab.Screen name="化粧品" component={CosmeticsScreen} />
          <Tab.Screen name="好きなもの" component={LikesScreen} />
          <Tab.Screen name="生理管理" component={PeriodScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
