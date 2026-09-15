import React, { useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useGame } from '../state/GameContext';
import { getCharacter, RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import { GachaPoolKind, GachaPullResult } from '../types';
import { MULTI_PULL_COUNT, PITY_LIMIT, SINGLE_PULL_COST, TEN_PULL_COST, pullGacha } from '../game/gacha';

type GlowKind = 'SSR' | 'SR' | 'normal';

const GLOW_COLOR: Record<GlowKind, string> = {
  SSR: '#ffd76a',
  SR: '#b164e8',
  normal: '#7c5cff',
};

const SUMMON_LABEL: Record<GlowKind, string> = {
  SSR: '眩い想いが共鳴している……!',
  SR: '強い想いが共鳴している……',
  normal: '交界石の記憶が共鳴している……',
};

const ORBIT_SHARD_ANGLES = [0, 60, 120, 180, 240, 300];
const ORBIT_RADIUS = 96;

function highestGlowKind(pulls: GachaPullResult[]): GlowKind {
  if (pulls.some((p) => p.rarity === 'SSR')) return 'SSR';
  if (pulls.some((p) => p.rarity === 'SR')) return 'SR';
  return 'normal';
}

export default function GachaScreen() {
  const { profile, updateProfile } = useGame();
  const [pool, setPool] = useState<GachaPoolKind>('character');
  const [results, setResults] = useState<GachaPullResult[] | null>(null);
  const [summoning, setSummoning] = useState(false);
  const [showSSRText, setShowSSRText] = useState(false);
  const [glowKind, setGlowKind] = useState<GlowKind>('normal');

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const ringRotateAnim = useRef(new Animated.Value(0)).current;
  const shockwaveAnim = useRef(new Animated.Value(0)).current;
  const ssrRevealAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const cardAnimsRef = useRef<Animated.Value[]>([]);
  const cardFlashRef = useRef<Animated.Value[]>([]);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ssrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPullsRef = useRef<GachaPullResult[] | null>(null);
  const activeLoopsRef = useRef<Animated.CompositeAnimation[]>([]);

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

  const revealResults = (pulls: GachaPullResult[]) => {
    activeLoopsRef.current.forEach((loop) => loop.stop());
    activeLoopsRef.current = [];
    setSummoning(false);
    setShowSSRText(false);
    flashAnim.setValue(1);
    cardAnimsRef.current = pulls.map(() => new Animated.Value(0));
    cardFlashRef.current = pulls.map(() => new Animated.Value(0));
    setResults(pulls);
    Animated.timing(flashAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start();
    Animated.stagger(
      90,
      pulls.map((_, i) =>
        Animated.parallel([
          Animated.spring(cardAnimsRef.current[i], { toValue: 1, friction: 6, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(cardFlashRef.current[i], { toValue: 1, duration: 110, useNativeDriver: true }),
            Animated.timing(cardFlashRef.current[i], { toValue: 0, duration: 380, useNativeDriver: true }),
          ]),
        ])
      )
    ).start();
  };

  const startSummonSequence = (pulls: GachaPullResult[]) => {
    const kind = highestGlowKind(pulls);
    setGlowKind(kind);
    setSummoning(true);
    setShowSSRText(false);
    pendingPullsRef.current = pulls;

    pulseAnim.setValue(0);
    ringRotateAnim.setValue(0);
    shockwaveAnim.setValue(0);
    ssrRevealAnim.setValue(0);
    shakeAnim.setValue(0);

    const pulseSpeed = kind === 'SSR' ? 340 : kind === 'SR' ? 440 : 520;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: pulseSpeed, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: pulseSpeed, useNativeDriver: true }),
      ])
    );
    const ringLoop = Animated.loop(
      Animated.timing(ringRotateAnim, { toValue: 1, duration: 4200, easing: Easing.linear, useNativeDriver: true })
    );
    pulseLoop.start();
    ringLoop.start();
    activeLoopsRef.current = [pulseLoop, ringLoop];

    const summonDuration = kind === 'SSR' ? 2100 : kind === 'SR' ? 1400 : 1000;

    if (kind === 'SSR') {
      ssrTimerRef.current = setTimeout(() => {
        setShowSSRText(true);
        Animated.spring(ssrRevealAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();
      }, summonDuration - 700);
    }

    revealTimerRef.current = setTimeout(() => {
      Animated.timing(shockwaveAnim, { toValue: 1, duration: 340, useNativeDriver: true }).start();
      const pending = pendingPullsRef.current;
      pendingPullsRef.current = null;
      if (pending) revealResults(pending);
    }, summonDuration);
  };

  const skipSummon = () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (ssrTimerRef.current) clearTimeout(ssrTimerRef.current);
    shockwaveAnim.setValue(1);
    const pending = pendingPullsRef.current;
    pendingPullsRef.current = null;
    if (pending) revealResults(pending);
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
                const flash = cardFlashRef.current[idx] ?? new Animated.Value(0);
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
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFill,
                        styles.tileFlash,
                        {
                          backgroundColor: RARITY_COLOR[r.rarity],
                          opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                        },
                      ]}
                    />
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
        <Animated.View
          style={[
            styles.summonOverlay,
            { transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
          ]}
        >
          <View style={styles.summonStage}>
            <View style={styles.stageLayer}>
              <Animated.View
                style={{
                  width: 1,
                  height: 1,
                  transform: [
                    { rotate: ringRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                  ],
                }}
              >
                {ORBIT_SHARD_ANGLES.map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const x = Math.cos(rad) * ORBIT_RADIUS;
                  const y = Math.sin(rad) * ORBIT_RADIUS;
                  return (
                    <Text
                      key={deg}
                      style={[styles.orbitShard, { left: x - 9, top: y - 9, color: glowColor }]}
                    >
                      ◆
                    </Text>
                  );
                })}
              </Animated.View>
            </View>

            <View style={styles.stageLayer} pointerEvents="none">
              <Animated.View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  borderWidth: 3,
                  borderColor: glowColor,
                  opacity: shockwaveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                  transform: [{ scale: shockwaveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.9] }) }],
                }}
              />
            </View>

            <View style={styles.stageLayer}>
              <Animated.View
                style={{
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                  transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.18] }) }],
                }}
              >
                <Svg width={200} height={200}>
                  <Defs>
                    <RadialGradient id="summonGlow" cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor={glowColor} stopOpacity={0.95} />
                      <Stop offset="0.55" stopColor={glowColor} stopOpacity={0.4} />
                      <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={100} cy={100} r={100} fill="url(#summonGlow)" />
                </Svg>
              </Animated.View>
            </View>
          </View>

          {showSSRText && (
            <Animated.Text
              style={[
                styles.ssrConfirmText,
                {
                  opacity: ssrRevealAnim,
                  transform: [{ scale: ssrRevealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                },
              ]}
            >
              ✨ SSR確定 ✨
            </Animated.Text>
          )}

          <Text style={[styles.summonText, { color: glowColor }]}>{SUMMON_LABEL[glowKind]}</Text>

          <Pressable style={styles.skipBtn} onPress={skipSummon}>
            <Text style={styles.skipBtnText}>タップでスキップ ▶</Text>
          </Pressable>
        </Animated.View>
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
    overflow: 'hidden',
  },
  tileFlash: { borderRadius: 10 },
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
  summonStage: { width: 240, height: 240 },
  stageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitShard: { position: 'absolute', fontSize: 18, fontWeight: '900' },
  ssrConfirmText: { fontSize: 22, fontWeight: '900', color: '#ffd76a', marginTop: 8 },
  summonText: { fontSize: 14, fontWeight: '800', marginTop: 20 },
  skipBtn: { marginTop: 28, paddingVertical: 8, paddingHorizontal: 16 },
  skipBtnText: { color: '#8a80b0', fontSize: 12, fontWeight: '700' },
  flashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
