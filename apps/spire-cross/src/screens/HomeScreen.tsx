import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { CHARACTERS } from '../data/characters';
import CharacterTile from '../components/CharacterTile';
import { buildStartingDeck, computeMaxHp } from '../game/deck';
import { generateRun } from '../game/mapGenerator';

const MAX_PARTY = 3;

export default function HomeScreen({ navigation }: any) {
  const { profile, run, setRun } = useGame();
  const owned = CHARACTERS.filter((c) => profile.ownedCharacterIds.includes(c.id));

  const [partyIds, setPartyIds] = useState<string[]>(
    run?.partyIds ?? owned.slice(0, MAX_PARTY).map((c) => c.id)
  );

  const toggleParty = (id: string) => {
    setPartyIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PARTY) return prev;
      return [...prev, id];
    });
  };

  const startRun = () => {
    if (partyIds.length === 0) {
      Alert.alert('パーティが未編成です', '最低1体のキャラクターを選択してください。');
      return;
    }
    const maxHp = computeMaxHp(partyIds);
    const newRun = {
      nodes: generateRun(),
      currentNodeId: null,
      deck: buildStartingDeck(partyIds),
      hp: maxHp,
      maxHp,
      partyIds,
      strength: 0,
      floor: 0,
    };
    setRun(newRun);
    navigation.navigate('冒険');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>スパイア・クロス</Text>
        <Text style={styles.subtitle}>デッキを組んで潜り、ガチャでキャラを集めよう</Text>

        <View style={styles.walletRow}>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>💰</Text>
            <Text style={styles.walletText}>{profile.gold}</Text>
          </View>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>💎</Text>
            <Text style={styles.walletText}>{profile.gems}</Text>
          </View>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>🏆</Text>
            <Text style={styles.walletText}>最高{profile.bestFloorCleared}階</Text>
          </View>
        </View>

        {run && (
          <Pressable style={styles.resumeBtn} onPress={() => navigation.navigate('冒険')}>
            <Text style={styles.resumeBtnText}>▶ 冒険を再開する (HP {run.hp}/{run.maxHp})</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>
          パーティ編成 ({partyIds.length}/{MAX_PARTY})
        </Text>
        <Text style={styles.helpText}>タップで出撃キャラを選択(所持キャラのみ)。開始時のデッキに影響します。</Text>
        <View style={styles.grid}>
          {CHARACTERS.map((c) => (
            <CharacterTile
              key={c.id}
              character={c}
              owned={profile.ownedCharacterIds.includes(c.id)}
              selected={partyIds.includes(c.id)}
              onPress={
                profile.ownedCharacterIds.includes(c.id) ? () => toggleParty(c.id) : undefined
              }
            />
          ))}
        </View>

        <Pressable style={styles.startBtn} onPress={startRun}>
          <Text style={styles.startBtnText}>{run ? '新しい冒険を始める(現在の冒険は破棄)' : '冒険を始める'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#9a9ab0', marginTop: 4, marginBottom: 16 },
  walletRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c26',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  walletEmoji: { fontSize: 14 },
  walletText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  resumeBtn: {
    backgroundColor: '#3f8efc',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  resumeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8 },
  helpText: { color: '#9a9ab0', fontSize: 12, marginTop: 2, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  startBtn: {
    backgroundColor: '#e8452f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
