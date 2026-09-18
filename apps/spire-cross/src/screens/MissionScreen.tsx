import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { getMissions } from '../game/missions';
import { THEME } from '../components/AppBackground';

export default function MissionScreen({ navigation }: any) {
  const { profile } = useGame();
  const missions = getMissions(profile);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable style={styles.backRow} onPress={() => navigation.navigate('ホーム')}>
        <Text style={styles.backLink}>← ホームへ戻る</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.container}>
        {missions.map((m) => (
          <View key={m.id} style={[styles.card, m.done && styles.cardDone]}>
            <Text style={styles.check}>{m.done ? '✅' : '⬜'}</Text>
            <Text style={[styles.label, m.done && styles.labelDone]}>{m.label}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(22,15,48,0.76)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,184,255,0.16)',
    padding: 14,
    marginBottom: 10,
  },
  cardDone: { borderColor: 'rgba(79,216,196,0.35)' },
  check: { fontSize: 16 },
  label: { color: '#f4f1ff', fontSize: 13, fontWeight: '700', flexShrink: 1 },
  labelDone: { color: THEME.teal, textDecorationLine: 'line-through' },
});
