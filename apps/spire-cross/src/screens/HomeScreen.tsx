import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { AP_MAX } from '../data/economy';
import { recoverAp } from '../game/ap';
import { getCharacter, RARITY_COLOR } from '../data/characters';
import Bar from '../components/Bar';
import HomeMapHotspots from '../components/HomeMapHotspots';

const ANNOUNCEMENTS = [
  { id: 'a1', title: 'プロトタイプ版へようこそ', body: 'スパイア・クロスのv2プロトタイプです。今後も内容は調整されます。' },
  { id: 'a2', title: '第1章 配信中', body: 'ストーリー第1章が挑戦可能です。まずはパーティを編成しましょう。' },
];

export default function HomeScreen({ navigation }: any) {
  const { profile } = useGame();
  const ap = useMemo(() => recoverAp(profile.ap), [profile.ap]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [mapWidth, setMapWidth] = useState(0);

  const onMapLayout = (e: LayoutChangeEvent) => setMapWidth(e.nativeEvent.layout.width);

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
  const missionsRemaining = missions.filter((m) => !m.done).length;

  return (
    <View style={styles.root} onLayout={onMapLayout}>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>スパイア・クロス</Text>

        {/* ヘッダー: 左上=プレイヤー情報 / 右上=通貨・お知らせ・ミッション */}
        <View style={styles.headerRow}>
          <View style={styles.playerBox}>
            <Text style={styles.playerLabel}>プレイヤー情報</Text>
            <Text style={styles.playerText}>パーティ平均 Lv{avgLevel}</Text>
            <Text style={styles.playerSubText}>
              所持キャラ {Object.keys(profile.ownedCharacterCounts).length}体
            </Text>
            <Bar value={ap.current} max={AP_MAX} color="#7c5cff" height={8} />
            <Text style={styles.apText}>
              AP {ap.current}/{AP_MAX}
            </Text>
          </View>

          <View style={styles.rightCol}>
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
            <Pressable style={styles.iconRow} onPress={() => setShowAnnouncements(true)}>
              <Text style={styles.iconRowEmoji}>📢</Text>
              <Text style={styles.iconRowLabel}>お知らせ</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{ANNOUNCEMENTS.length}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.iconRow} onPress={() => setShowMissions(true)}>
              <Text style={styles.iconRowEmoji}>📋</Text>
              <Text style={styles.iconRowLabel}>ミッション</Text>
              {missionsRemaining > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{missionsRemaining}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <Text style={styles.partyLabel}>パーティー</Text>
        <View style={styles.partyRow}>
          {profile.partyIds.length === 0 ? (
            <Pressable style={styles.partyEmptyBox} onPress={() => navigation.navigate('キャラ')}>
              <Text style={styles.partyEmptyText}>パーティが未編成です{'\n'}タップして編成する</Text>
            </Pressable>
          ) : (
            profile.partyIds.map((id) => {
              const character = getCharacter(id);
              const level = profile.characterProgress[id]?.level ?? 1;
              if (!character) return null;
              return (
                <Pressable
                  key={id}
                  style={styles.partyMember}
                  onPress={() => navigation.navigate('キャラ')}
                >
                  <View style={[styles.partyAvatar, { borderColor: RARITY_COLOR[character.rarity] }]}>
                    <Text style={styles.partyEmoji}>{character.emoji}</Text>
                    <View style={[styles.partyLevelBadge, { backgroundColor: RARITY_COLOR[character.rarity] }]}>
                      <Text style={styles.partyLevelText}>Lv{level}</Text>
                    </View>
                  </View>
                  <Text style={styles.partyName} numberOfLines={1}>
                    {character.name}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* 下部は背景イラスト(宿・屋台・塔への道・魔法陣)を見せるための余白。
            実際のタップ操作は下のマップホットスポット層(画面全体オーバーレイ)が担う。 */}
        <View style={styles.mapSpacer} />
      </ScrollView>

      <HomeMapHotspots width={mapWidth} onNavigate={(target) => navigation.navigate(target)} />

      <Modal visible={showAnnouncements} transparent animationType="fade" onRequestClose={() => setShowAnnouncements(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAnnouncements(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>お知らせ</Text>
            {ANNOUNCEMENTS.map((a) => (
              <View key={a.id} style={styles.announceItem}>
                <Text style={styles.announceTitle}>📢 {a.title}</Text>
                <Text style={styles.announceBody}>{a.body}</Text>
              </View>
            ))}
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowAnnouncements(false)}>
              <Text style={styles.modalCloseBtnText}>閉じる</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showMissions} transparent animationType="fade" onRequestClose={() => setShowMissions(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMissions(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>ミッション</Text>
            {missions.map((m) => (
              <View key={m.id} style={styles.missionRow}>
                <Text style={styles.missionCheck}>{m.done ? '✅' : '⬜'}</Text>
                <Text style={[styles.missionText, m.done && styles.missionTextDone]}>{m.label}</Text>
              </View>
            ))}
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowMissions(false)}>
              <Text style={styles.modalCloseBtnText}>閉じる</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  mapSpacer: { height: 260 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12 },
  headerRow: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'flex-start' },
  playerBox: {
    flex: 1.1,
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  playerLabel: { color: '#c9b8ff', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  playerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  playerSubText: { color: '#9a90b8', fontSize: 11, marginTop: 2, marginBottom: 8 },
  apText: { color: '#9a90b8', fontSize: 10, marginTop: 4 },
  rightCol: { flex: 1, gap: 6 },
  walletRow: { flexDirection: 'row', gap: 6 },
  walletChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  walletEmoji: { fontSize: 13 },
  walletText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  iconRowEmoji: { fontSize: 13 },
  iconRowLabel: { color: '#fff', fontSize: 11, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: '#f5b400',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#1b1040', fontSize: 9, fontWeight: '800' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  partyLabel: {
    color: '#c9b8ff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
    letterSpacing: 2,
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 22,
    minHeight: 128,
  },
  partyMember: { alignItems: 'center', width: 96 },
  partyAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(20,14,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  partyEmoji: { fontSize: 44 },
  partyLevelBadge: {
    position: 'absolute',
    bottom: -6,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  partyLevelText: { color: '#1b1040', fontSize: 11, fontWeight: '800' },
  partyName: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  partyEmptyBox: {
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.35)',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  partyEmptyText: { color: '#c4c4d4', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5,3,15,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#1b1330',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.35)',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  announceItem: { marginBottom: 10 },
  announceTitle: { color: '#f5b400', fontWeight: '700', fontSize: 12 },
  announceBody: { color: '#c4c4d4', fontSize: 11, marginTop: 2 },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  missionCheck: { fontSize: 14, marginRight: 8 },
  missionText: { color: '#c4c4d4', fontSize: 12 },
  missionTextDone: { color: '#5fae6b', textDecorationLine: 'line-through' },
  modalCloseBtn: { marginTop: 8, backgroundColor: '#7c5cff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modalCloseBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
