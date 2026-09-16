import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { PlayerRole, TravelerBuild } from '../types';
import {
  PLAYER_ROLES,
  ROLE_COLOR,
  ROLE_DESCRIPTION,
  ROLE_EMOJI,
  ROLE_LABEL,
  ROLE_READING,
  ROLE_TITLE,
} from '../data/roles';
import {
  STAT_POINT_POOL,
  TRAVELER_ID,
  computeTravelerBaseStats,
  createDefaultTravelerBuild,
  remainingPoints,
  usedPoints,
} from '../game/travelerBuild';
import { createInitialProgress } from '../game/leveling';

const STAT_LABEL: Record<'hp' | 'atk' | 'def', string> = { hp: 'HP', atk: '攻撃力', def: '防御力' };
const STAT_STEP: Record<'hp' | 'atk' | 'def', number> = { hp: 1, atk: 1, def: 1 };

export default function TravelerCreateView({
  onBack,
  gate,
}: {
  onBack: () => void;
  /** true の場合、初回起動時の必須作成フロー(タブバーが無く、戻る導線も出さない)として表示する */
  gate?: boolean;
}) {
  const { profile, updateProfile } = useGame();
  const existing = profile.traveler;
  const [build, setBuild] = useState<TravelerBuild>(
    existing ?? createDefaultTravelerBuild('', 'pierce')
  );

  const stats = computeTravelerBaseStats(build);
  const remaining = remainingPoints(build);
  const used = usedPoints(build);

  const setRole = (role: PlayerRole) => setBuild((prev) => ({ ...prev, role }));
  const setName = (name: string) => setBuild((prev) => ({ ...prev, name }));

  const adjustStat = (stat: 'hp' | 'atk' | 'def', delta: number) => {
    setBuild((prev) => {
      const nextVal = prev.allocatedPoints[stat] + delta;
      if (nextVal < 0) return prev;
      if (delta > 0 && remainingPoints(prev) <= 0) return prev;
      return { ...prev, allocatedPoints: { ...prev.allocatedPoints, [stat]: nextVal } };
    });
  };

  const handleConfirm = () => {
    if (!build.name.trim()) {
      Alert.alert('名前を入力してください', '旅人の名前を決めてから確定してください。');
      return;
    }
    updateProfile((prev) => {
      const alreadyOwned = !!prev.ownedCharacterCounts[TRAVELER_ID];
      const nextParty =
        !alreadyOwned && prev.partyIds.length < 3 ? [...prev.partyIds, TRAVELER_ID] : prev.partyIds;
      return {
        ...prev,
        traveler: build,
        ownedCharacterCounts: { ...prev.ownedCharacterCounts, [TRAVELER_ID]: 1 },
        characterProgress: {
          ...prev.characterProgress,
          [TRAVELER_ID]: prev.characterProgress[TRAVELER_ID] ?? createInitialProgress(),
        },
        partyIds: nextParty,
      };
    });
    Alert.alert(existing ? '旅人を更新しました' : '旅人が誕生しました', undefined, [{ text: 'OK', onPress: onBack }]);
  };

  const content = (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      {!gate && (
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← キャラクターへ戻る</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{gate ? '旅人を作る' : existing ? '旅人を編集' : '旅人を作成'}</Text>
      <Text style={styles.subtitle}>
        {gate
          ? '目を覚ましたあなたに残っているのは、名前と、わずかな力の記憶だけ。塔を昇る前に、いまの自分を形にしよう。'
          : '記憶の大半を失った旅人の、いま確かに残っているものだけを形にする。'}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>名前</Text>
        <TextInput
          value={build.name}
          onChangeText={setName}
          placeholder="旅人の名前"
          placeholderTextColor="#6a6485"
          style={styles.nameInput}
          maxLength={12}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>役職</Text>
        <View style={styles.roleGrid}>
          {PLAYER_ROLES.map((role) => {
            const isSelected = build.role === role;
            return (
              <Pressable
                key={role}
                style={[
                  styles.roleCard,
                  { borderColor: ROLE_COLOR[role] },
                  isSelected && { backgroundColor: `${ROLE_COLOR[role]}33` },
                ]}
                onPress={() => setRole(role)}
              >
                <Text style={styles.roleEmoji}>{ROLE_EMOJI[role]}</Text>
                <Text style={styles.roleLabel}>
                  {ROLE_LABEL[role]}({ROLE_READING[role]})
                </Text>
                <Text style={styles.roleSubtitle}>{ROLE_TITLE[role]}</Text>
                <Text style={styles.roleDesc}>{ROLE_DESCRIPTION[role]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.pointHeaderRow}>
          <Text style={styles.sectionTitle}>ステータス振り分け</Text>
          <Text style={styles.pointRemain}>
            残り {remaining} / {STAT_POINT_POOL}pt
          </Text>
        </View>
        {(['hp', 'atk', 'def'] as const).map((stat) => (
          <View key={stat} style={styles.statRow}>
            <Text style={styles.statLabel}>{STAT_LABEL[stat]}</Text>
            <Pressable
              style={styles.statBtn}
              onPress={() => adjustStat(stat, -STAT_STEP[stat])}
              disabled={build.allocatedPoints[stat] <= 0}
            >
              <Text style={styles.statBtnText}>−</Text>
            </Pressable>
            <Text style={styles.statPoints}>{build.allocatedPoints[stat]}pt</Text>
            <Pressable
              style={styles.statBtn}
              onPress={() => adjustStat(stat, STAT_STEP[stat])}
              disabled={remaining <= 0}
            >
              <Text style={styles.statBtnText}>＋</Text>
            </Pressable>
            <Text style={styles.statResult}>→ {stats[stat]}</Text>
          </View>
        ))}
        <Text style={styles.pointHint}>
          使用済み {used}pt。役職ごとの得手・不得手は自動で上乗せされます。
        </Text>
      </View>

      <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmBtnText}>{existing ? 'この内容で更新する' : 'この旅人で塔を昇る'}</Text>
      </Pressable>
    </ScrollView>
  );

  if (gate) {
    return <SafeAreaView style={styles.gateSafe}>{content}</SafeAreaView>;
  }
  return content;
}

const styles = StyleSheet.create({
  gateSafe: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#9a9ab0', fontSize: 12, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  section: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 10 },
  nameInput: {
    backgroundColor: 'rgba(10,8,24,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.35)',
  },
  roleGrid: { gap: 10 },
  roleCard: { borderWidth: 2, borderRadius: 12, padding: 12, backgroundColor: 'rgba(15,11,32,0.6)' },
  roleEmoji: { fontSize: 24, marginBottom: 4 },
  roleLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  roleSubtitle: { color: '#c9b8ff', fontSize: 11, marginTop: 2, fontWeight: '700' },
  roleDesc: { color: '#9a9ab0', fontSize: 11, marginTop: 4, lineHeight: 16 },
  pointHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointRemain: { color: '#f5b400', fontWeight: '800', fontSize: 12 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { color: '#fff', fontSize: 13, fontWeight: '700', width: 56 },
  statBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(124,92,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  statPoints: { color: '#c4c4d4', fontSize: 12, width: 48, textAlign: 'center' },
  statResult: { color: '#5fae6b', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  pointHint: { color: '#6a6485', fontSize: 10, marginTop: 4 },
  confirmBtn: { backgroundColor: '#7c5cff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
