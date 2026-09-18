import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ANNOUNCEMENTS } from '../data/announcements';
import { THEME } from '../components/AppBackground';

export default function NewsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable style={styles.backRow} onPress={() => navigation.navigate('ホーム')}>
        <Text style={styles.backLink}>← ホームへ戻る</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.container}>
        {ANNOUNCEMENTS.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.title}>{a.title}</Text>
            <Text style={styles.body}>{a.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  backRow: { paddingHorizontal: 16, paddingTop: 8 },
  backLink: { color: THEME.lavender, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  container: { padding: 16, paddingTop: 12, paddingBottom: 48 },
  card: {
    backgroundColor: 'rgba(22,15,48,0.76)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,184,255,0.16)',
    padding: 14,
    marginBottom: 10,
  },
  title: { color: THEME.gold, fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  body: { color: THEME.lavender, fontSize: 12, marginTop: 6, lineHeight: 18, opacity: 0.85 },
});
