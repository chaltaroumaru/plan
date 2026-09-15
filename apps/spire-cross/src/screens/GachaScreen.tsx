import React, { useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useGame } from '../state/GameContext';
import { getCharacter, RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import { GachaPoolKind, GachaPullResult } from '../types';
import { MULTI_PULL_COUNT, PITY_LIMIT, SINGLE_PULL_COST, TEN_PULL_COST, pullGacha } from '../game/gacha';

const GLOW_COLOR: Record<'SSR' | 'SR' | 'normal', string> = {
  SSR: '#ffd76a',
  SR: '#b164e8',
  normal: '#7c5cff',
};

const SUMMON_LABEL: Record<'SSR' | 'SR' | 'normal', string> = {
  SSR: '眩い想いが共鳴している……!',
  SR: '強い想いが共鳴している……',
  normal: '交界石の記憶が共鳴している……',
};

function highestGlowKind(pulls: GachaPullResult[]): 'SSR' | 'SR' | 'normal' {
  if (pulls.some((p) => p.rarity === 'SSR')) return 'SSR';
  if (pulls.some((p) => p.rarity === 'SR')) return 'SR';
  return 'normal';
}

export default function GachaScreen() {
  const { profile, updateProfile } = useGame();
  const [pool, setPool] = useState<GachaPoolKind>('character');
  const [results, setResults] = useState<GachaPullResult[] | null>(null);
  const [summoning, setSummoning] = useState(false);
  const [glowKind, setGlowKind] = useState<'SSR' | 'SR' | 'normal'>('normal');

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const cardAnimsRef = useRef<Animated.Value[]>([]);

  const pity = pool === 'character' ? profile.charPity : profile.cardPity;
  const pityRemain = Math.max(0, PITY_LIMIT - pity);

  const doPull = (count: 1 | typeof MULTI_PULL_COUNT) => {
    const cost = count === 1 ? SINGLE_PULL_COST : TEN_PULL_COST;
    if (profile.stones < cost) {
      Alert.alert('交界石が足りません', `${cost}個必要です。`);
      return;
    }
    const outcome = pullGacha(profile, pool, count);
    updateProfile(() => outcome.profile);
    setResults(null);
    startSummonSequence(outcome.pulls);
  };

  const startSummonSequence = (pulls: GachaPullResult[]) => {
    const kind = highestGlowKind(pulls);
    setGlowKind(kind);
    setSummoning(true);
    pulseAnim.setValue(0);
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 520, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    const summonDuration = kind === 'SSR' ? 1600 : kind === 'SR' ? 1300 : 1000;
    setTimeout(() => {
      pulseLoop.stop();
      flashAnim.setValue(1);
      setSummoning(false);
      cardAnimsRef.current = pulls.map(() => new Animated.Value(0));
      setResults(pulls);
      Animated.timing(flashAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start();
      Animated.stagger(
        80,
        cardAnimsRef.current.map((v) => Animated.spring(v, { toValue: 1, friction: 6, useNativeDriver: true }))
      ).start();
    }, summonDuration);
  };

  const switchPool = (next: GachaPoolKind) => {
    setPool(next);
    setResults(null);
  };

  const glowColor = GLOW_COLOR[glowKind];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ガチャ</Text>
        <View style={styles.walletChip}>
          <Text style={styles.walletText}>💎 交界石 {profile.stones}</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, pool === 'character' && styles.tabBtnActive]}
            onPress={() => switchPool('character')}
          >
            <Text style={[styles.tabText, pool === 'character' && styles.tabTextActive]}>
              キャラガチャ
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, pool === 'card' && styles.tabBtnActive]}
            onPress={() => switchPool('card')}
          >
            <Text style={[styles.tabText, pool === 'card' && styles.tabTextActive]}>カードガチャ</Text>
          </Pressable>
        </View>

        <View style={styles.rateBox}>
          <Text style={styles.rateText}>排出率  SSR 3% / SR 12% / R 35% / N 50%</Text>
          <Text style={styles.rateText}>天井まであと{pityRemain}回で SSR 確定</Text>
          <Text style={styles.rateText}>10+1連は R 以上が1件確定</Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.pullBtn} onPress={() => doPull(1)} disabled={summoning}>
            <Text style={styles.pullBtnText}>1回引く</Text>
            <Text style={styles.pullBtnSub}>💎{SINGLE_PULL_COST}</Text>
          </Pressable>
          <Pressable
            style={[styles.pullBtn, styles.pullBtnTen]}
            onPress={() => doPull(MULTI_PULL_COUNT)}
            disabled={summoning}
          >
            <Text style={styles.pullBtnText}>10+1連引く</Text>
            <Text style={styles.pullBtnSub}>💎{TEN_PULL_COST}</Text>
          </Pressable>
        </View>

        {results && (
          <View style={styles.resultsBox}>
            <Text style={styles.resultsTitle}>結果</Text>
            <View style={styles.resultsGrid}>
              {results.map((r, idx) => {
                const emoji = r.pool === 'character' ? getCharacter(r.id)?.emoji : '🎴';
                const name = r.pool === 'character' ? getCharacter(r.id)?.name : getCard(r.id).name;
                const anim = cardAnimsRef.current[idx] ?? new Animated.Value(1);
                return (
                  <Animated.View
                    key={idx}
                    testID={`gacha-result-${idx}`}
                    style={[
                      styles.resultTile,
                      { borderColor: RARITY_COLOR[r.rarity] },
                      {
                        opacity: anim,
                        transform: [
                          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.resultEmoji}>{emoji}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[r.rarity] }]}>
                      <Text style={styles.rarityBadgeText}>{r.rarity}</Text>
                    </View>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {name}
                    </Text>
                    {r.isNew ? (
                      <Text style={styles.newTag}>NEW!</Text>
                    ) : (
                      <Text style={styles.dupeTag}>
                        {r.pool === 'character' ? '重複→ゴールド' : '所持数+1'}
                      </Text>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={summoning} transparent animationType="fade">
        <View style={styles.summonOverlay}>
          <Animated.View
            style={{
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.18] }) }],
            }}
          >
            <Svg width={220} height={220}>
              <Defs>
                <RadialGradient id="summonGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={glowColor} stopOpacity={0.95} />
                  <Stop offset="0.55" stopColor={glowColor} stopOpacity={0.4} />
                  <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={110} cy={110} r={110} fill="url(#summonGlow)" />
            </Svg>
          </Animated.View>
          <Text style={[styles.summonText, { color: glowColor }]}>{SUMMON_LABEL[glowKind]}</Text>
        </View>
      </Modal>

      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flashAnim, backgroundColor: glowColor }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  walletChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  walletText: { color: '#fff', fontWeight: '700' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#7c5cff' },
  tabText: { color: '#9a9ab0', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  rateBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 12, marginBottom: 16 },
  rateText: { color: '#c4c4d4', fontSize: 12, marginBottom: 2 },
  btnRow: { flexDirection: 'row', gap: 12 },
  pullBtn: {
    flex: 1,
    backgroundColor: '#7c5cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pullBtnTen: { backgroundColor: '#b164e8' },
  pullBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pullBtnSub: { color: '#fff', fontSize: 12, marginTop: 2 },
  resultsBox: { marginTop: 24 },
  resultsTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 8 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  resultTile: {
    width: 96,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(30,20,58,0.78)',
    padding: 8,
    alignItems: 'center',
    margin: 4,
  },
  resultEmoji: { fontSize: 28, marginTop: 8 },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rarityBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  resultName: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4 },
  newTag: { color: '#f5b400', fontSize: 10, fontWeight: '800', marginTop: 2 },
  dupeTag: { color: '#9a9ab0', fontSize: 9, marginTop: 2 },
  summonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,4,16,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summonText: { fontSize: 14, fontWeight: '800', marginTop: 20 },
  flashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
