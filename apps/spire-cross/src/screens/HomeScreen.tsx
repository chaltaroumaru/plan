import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { getCharacter } from '../data/characters';
import { AP_MAX } from '../data/economy';
import { recoverAp } from '../game/ap';
import Bar from '../components/Bar';

const ANNOUNCEMENTS = [
  { id: 'a1', title: 'プロトタイプ版へようこそ', body: 'スパイア・クロスのv2プロトタイプです。今後も内容は調整されます。' },
  { id: 'a2', title: '第1章 配信中', body: 'ストーリー第1章が挑戦可能です。まずはパーティを編成しましょう。' },
];

const NAV_ITEMS: { key: string; label: string; emoji: string }[] = [
  { key: 'ダンジョン', label: 'ダンジョン', emoji: '🗺️' },
  { key: 'ストーリー', label: 'ストーリー', emoji: '📖' },
  { key: 'キャラ', label: 'キャラ', emoji: '👥' },
  { key: 'ガチャ', label: 'ガチャ', emoji: '🎰' },
  { key: '設定', label: '設定', emoji: '⚙️' },
];

export default function HomeScreen({ navigation }: any) {
  const { profile } = useGame();
  const ap = useMemo(() => recoverAp(profile.ap), [profile.ap]);

  const partyLevels = profile.partyIds
    .map((id) => profile.characterProgress[id]?.level)
    .filter((l): l is number => typeof l === 'number');
  const avgLevel =
    partyLevels.length > 0 ? Math.round(partyLevels.reduce((a, b) => a + b, 0) / partyLevels.length) : 0;

  const missions = [
    { id: 'm1', label: 'ガチャを1回引く', done: profile.totalCharPulls + profile.totalCardPulls > 0 },
    { id: 'm2', label: 'パーティを編成する', done: profile.partyIds.length > 0 },
    { id: 'm3', label: 'ストーリー第1章を1つクリアする', done: profile.clearedStoryStageIds.length > 0 },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>スパイア・クロス</Text>

        <View style={styles.announceBox}>
          {ANNOUNCEMENTS.map((a) => (
            <View key={a.id} style={styles.announceItem}>
              <Text style={styles.announceTitle}>📢 {a.title}</Text>
              <Text style={styles.announceBody}>{a.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.playerBox}>
          <Text style={styles.playerText}>パーティ平均Lv {avgLevel} ・ 所持キャラ {Object.keys(profile.ownedCharacterCounts).length}体</Text>
          <Bar value={ap.current} max={AP_MAX} color="#3f8efc" height={10} />
          <Text style={styles.apText}>
            AP {ap.current}/{AP_MAX}
          </Text>
        </View>

        <View style={styles.walletRow}>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>💰</Text>
            <Text style={styles.walletText}>{profile.gold}</Text>
          </View>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>💎</Text>
            <Text style={styles.walletText}>{profile.stones}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ミッション</Text>
        <View style={styles.missionBox}>
          {missions.map((m) => (
            <View key={m.id} style={styles.missionRow}>
              <Text style={styles.missionCheck}>{m.done ? '✅' : '⬜'}</Text>
              <Text style={[styles.missionText, m.done && styles.missionTextDone]}>{m.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>メニュー</Text>
        <View style={styles.navGrid}>
          {NAV_ITEMS.map((item) => (
            <Pressable key={item.key} style={styles.navCard} onPress={() => navigation.navigate(item.key)}>
              <Text style={styles.navEmoji}>{item.emoji}</Text>
              <Text style={styles.navLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12 },
  announceBox: { backgroundColor: '#1c1c26', borderRadius: 12, padding: 12, marginBottom: 12 },
  announceItem: { marginBottom: 8 },
  announceTitle: { color: '#f5b400', fontWeight: '700', fontSize: 12 },
  announceBody: { color: '#c4c4d4', fontSize: 11, marginTop: 2 },
  playerBox: { backgroundColor: '#1c1c26', borderRadius: 12, padding: 12, marginBottom: 12 },
  playerText: { color: '#fff', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  apText: { color: '#9a9ab0', fontSize: 11, marginTop: 4 },
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
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  missionBox: { backgroundColor: '#1c1c26', borderRadius: 12, padding: 12, marginBottom: 8 },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  missionCheck: { fontSize: 14, marginRight: 8 },
  missionText: { color: '#c4c4d4', fontSize: 12 },
  missionTextDone: { color: '#5fae6b', textDecorationLine: 'line-through' },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navCard: {
    width: '30%',
    backgroundColor: '#1c1c26',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  navEmoji: { fontSize: 26, marginBottom: 4 },
  navLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
