import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../components/AppBackground';

/** フレンド機能のプレースホルダー画面。実装は今後追加予定。 */
export default function FriendScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.text}>フレンド機能は準備中です。しばらくお待ちください。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingTop: 24 },
  card: {
    backgroundColor: 'rgba(22,15,48,0.76)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,184,255,0.16)',
    padding: 16,
  },
  text: { color: THEME.lavender, fontSize: 13, lineHeight: 20 },
});
