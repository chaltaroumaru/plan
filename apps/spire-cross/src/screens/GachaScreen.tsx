import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { getCharacter, RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import { GachaPoolKind, GachaPullResult } from '../types';
import { MULTI_PULL_COUNT, PITY_LIMIT, SINGLE_PULL_COST, TEN_PULL_COST, pullGacha } from '../game/gacha';
import { THEME } from '../components/AppBackground';

// ガチャ演出の段階。
// video: 光が駆け上り、星が浮かび上がるまでの導入(簡易演出。作り直し予定)。
// paused: 浮かび上がった星が画面中央で静止し、タップを待っている状態。
// burst: (10+1連のみ)星が割れて引いた数だけレアリティ色の破片に分裂する。
// reveal: 光が晴れた後、キャラクターを1体ずつ表示する。
type Phase = 'idle' | 'video' | 'paused' | 'burst' | 'reveal';

export default function GachaScreen() {
  const { profile, updateProfile } = useGame();
  const [pool, setPool] = useState<GachaPoolKind>('character');
  const [results, setResults] = useState<GachaPullResult[] | null>(null);
  const [showSSRText, setShowSSRText] = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const cardAnimsRef = useRef<Animated.Value[]>([]);
  const cardFlashRef = useRef<Animated.Value[]>([]);
  const ssrRevealAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [phase, setPhase] = useState<Phase>('idle');
  const [pulls, setPulls] = useState<GachaPullResult[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [overlaySize, setOverlaySize] = useState({ width: 360, height: 640 });
  const pullsRef = useRef<GachaPullResult[] | null>(null);
  const burstShardAnimsRef = useRef<Animated.Value[]>([]);
  const burstFlashAnim = useRef(new Animated.Value(0)).current;
  const cardTintAnim = useRef(new Animated.Value(0)).current;
  const revealCardAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // 一時停止中は、浮かび上がった星がゆっくり呼吸するように明滅させる。
  useEffect(() => {
    if (phase !== 'paused') return;
    pulseAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulseAnim]);

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
    startSummon(outcome.pulls);
  };

  // 導入演出(光が昇り、星が浮かび上がる)を再生してから一時停止状態へ。
  const startSummon = (nextPulls: GachaPullResult[]) => {
    pullsRef.current = nextPulls;
    setPulls(nextPulls);
    setRevealIndex(-1);
    setPhase('video');
    riseAnim.setValue(0);
    starAnim.setValue(0);
    Animated.timing(riseAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      Animated.spring(starAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start(() => {
        setPhase('paused');
      });
    });
  };

  // 画面タップ: 導入演出中なら星が浮かび上がった状態まで早送り、
  // 一時停止中なら次のステップへ、キャラ表示中なら次のキャラへ。
  const handleOverlayTap = () => {
    if (phase === 'video') {
      riseAnim.stopAnimation();
      riseAnim.setValue(1);
      starAnim.stopAnimation();
      starAnim.setValue(1);
      setPhase('paused');
    } else if (phase === 'paused') {
      confirmPaused();
    } else if (phase === 'reveal') {
      advanceReveal();
    }
  };

  // 静止した星をタップ: 10+1連なら割れて分裂→1連なら分裂を飛ばして
  // そのまま魔法陣の光が画面を覆う演出へ。
  const confirmPaused = () => {
    const current = pullsRef.current;
    if (!current) return;
    if (current.length > 1) {
      startBurst(current);
    } else {
      flashAndReveal(current);
    }
  };

  // 星が割れて、引いた数だけレアリティ色の破片に分裂する演出。
  const startBurst = (current: GachaPullResult[]) => {
    setPhase('burst');
    burstFlashAnim.setValue(0);
    burstShardAnimsRef.current = current.map(() => new Animated.Value(0));
    Animated.stagger(
      45,
      burstShardAnimsRef.current.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true })
      )
    ).start(() => flashAndReveal(current));
  };

  // 魔法陣が光って画面全体を覆い、その光が消えてから1体目を表示する。
  const flashAndReveal = (current: GachaPullResult[]) => {
    Animated.timing(burstFlashAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start(() => {
      setPhase('reveal');
      setRevealIndex(0);
      playRevealCard(current, 0);
    });
  };

  // 光が晴れて、キャラクターを1体表示する演出。
  const playRevealCard = (current: GachaPullResult[], index: number) => {
    const pull = current[index];
    revealCardAnim.setValue(0);
    cardTintAnim.setValue(1);
    Animated.timing(burstFlashAnim, { toValue: 0, duration: 420, useNativeDriver: true }).start();
    Animated.timing(cardTintAnim, { toValue: 0, duration: 420, useNativeDriver: true }).start();
    Animated.spring(revealCardAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    if (pull.rarity === 'SSR') {
      setShowSSRText(true);
      ssrRevealAnim.setValue(0);
      shakeAnim.setValue(0);
      Animated.spring(ssrRevealAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    } else {
      setShowSSRText(false);
    }
  };

  // タップで次のキャラへ。最後まで見終えたら通常の結果画面(グリッド)へ。
  const advanceReveal = () => {
    const current = pullsRef.current;
    if (!current) return;
    const next = revealIndex + 1;
    if (next >= current.length) {
      finishSummon(current);
      return;
    }
    setRevealIndex(next);
    playRevealCard(current, next);
  };

  const finishSummon = (finalPulls: GachaPullResult[]) => {
    setPhase('idle');
    setShowSSRText(false);
    pullsRef.current = null;
    setPulls(null);
    setRevealIndex(-1);
    revealResults(finalPulls);
  };

  // 演出スキップ: 導入演出・分裂・1体ずつの表示をすべて飛ばして結果画面へ。
  const skipToResults = () => {
    const current = pullsRef.current;
    if (current) finishSummon(current);
    else setPhase('idle');
  };

  const revealResults = (finalPulls: GachaPullResult[]) => {
    flashAnim.setValue(1);
    cardAnimsRef.current = finalPulls.map(() => new Animated.Value(0));
    cardFlashRef.current = finalPulls.map(() => new Animated.Value(0));
    setResults(finalPulls);
    Animated.timing(flashAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start();
    Animated.stagger(
      90,
      finalPulls.map((_, i) =>
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

  const switchPool = (next: GachaPoolKind) => {
    setPool(next);
    setResults(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
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
          <Pressable style={styles.pullBtn} onPress={() => doPull(1)} disabled={phase !== 'idle'}>
            <Text style={styles.pullBtnText}>1回引く</Text>
            <Text style={styles.pullBtnSub}>💎{SINGLE_PULL_COST}</Text>
          </Pressable>
          <Pressable
            style={[styles.pullBtn, styles.pullBtnTen]}
            onPress={() => doPull(MULTI_PULL_COUNT)}
            disabled={phase !== 'idle'}
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

      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flashAnim, backgroundColor: '#ffe9a8' }]}
      />

      {phase !== 'idle' && (
        <View
          style={styles.overlay}
          onLayout={(e) => setOverlaySize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          {(phase === 'video' || phase === 'paused') && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.riseBeam,
                  {
                    left: overlaySize.width / 2 - 22,
                    height: riseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, overlaySize.height * 0.55] }),
                  },
                ]}
              />
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.riseStarText,
                  {
                    opacity: starAnim,
                    transform: [
                      {
                        scale: Animated.add(
                          starAnim,
                          pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] })
                        ),
                      },
                    ],
                  },
                ]}
              >
                ✦
              </Animated.Text>
            </>
          )}

          {phase === 'paused' && (
            <Text pointerEvents="none" style={styles.pausedHint}>
              タップして開封 ▶
            </Text>
          )}

          {phase === 'burst' &&
            pulls?.map((p, idx) => {
              const v = burstShardAnimsRef.current[idx] ?? new Animated.Value(0);
              const isSSR = p.rarity === 'SSR';
              const angle = (idx / pulls.length) * Math.PI * 2;
              const dist = 90 + (idx % 3) * 22;
              const dx = Math.cos(angle) * dist;
              const dy = Math.sin(angle) * dist * 0.6;
              return (
                <Animated.View
                  key={idx}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: overlaySize.width / 2 - 12,
                    top: overlaySize.height / 2 - 12,
                    opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0.9] }),
                    transform: [
                      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
                      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
                      {
                        scale: v.interpolate({
                          inputRange: [0, 0.3, 1],
                          outputRange: [0.2, isSSR ? 1.4 : 1, isSSR ? 1.2 : 0.9],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={{ fontSize: isSSR ? 26 : 18, color: RARITY_COLOR[p.rarity] }}>◆</Text>
                </Animated.View>
              );
            })}

          {phase === 'reveal' &&
            pulls &&
            revealIndex >= 0 &&
            (() => {
              const p = pulls[revealIndex];
              const emoji = p.pool === 'character' ? getCharacter(p.id)?.emoji : '🎴';
              const name = p.pool === 'character' ? getCharacter(p.id)?.name : getCard(p.id).name;
              return (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: RARITY_COLOR[p.rarity], opacity: cardTintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.revealCardWrap,
                      {
                        opacity: revealCardAnim,
                        transform: [{ scale: revealCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                      },
                    ]}
                  >
                    <View pointerEvents="none" style={[styles.revealGlow, { backgroundColor: RARITY_COLOR[p.rarity] }]} />
                    <View style={[styles.revealFrame, { borderColor: RARITY_COLOR[p.rarity] }]}>
                      <Text style={styles.revealEmoji}>{emoji}</Text>
                      <View style={[styles.rarityBadgeLarge, { backgroundColor: RARITY_COLOR[p.rarity] }]}>
                        <Text style={styles.rarityBadgeLargeText}>{p.rarity}</Text>
                      </View>
                      <Text style={styles.revealName} numberOfLines={1}>
                        {name}
                      </Text>
                      {p.isNew ? (
                        <Text style={styles.newTag}>NEW!</Text>
                      ) : (
                        <Text style={styles.dupeTag}>{p.pool === 'character' ? '重複→ゴールド' : '所持数+1'}</Text>
                      )}
                    </View>
                  </Animated.View>
                  <Text style={styles.revealProgress}>
                    {revealIndex + 1} / {pulls.length}
                  </Text>
                  {showSSRText && (
                    <Animated.Text
                      style={[
                        styles.ssrConfirmText,
                        styles.revealSSRText,
                        {
                          opacity: ssrRevealAnim,
                          transform: [
                            { scale: ssrRevealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                            { translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
                          ],
                        },
                      ]}
                    >
                      ✨ SSR確定 ✨
                    </Animated.Text>
                  )}
                  <Text style={styles.revealHint}>タップで次へ ▶</Text>
                </>
              );
            })()}

          <Animated.View pointerEvents="none" style={[styles.multiFlashOverlay, { opacity: burstFlashAnim }]} />

          <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayTap} />

          <Pressable style={styles.skipBtn} onPress={skipToResults} hitSlop={10}>
            <Text style={styles.skipBtnText}>スキップ ▶▶</Text>
          </Pressable>
        </View>
      )}
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
  flashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: THEME.bgTop,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  riseBeam: {
    position: 'absolute',
    bottom: 0,
    width: 44,
    borderRadius: 22,
    backgroundColor: THEME.gold,
    opacity: 0.3,
  },
  riseStarText: { fontSize: 64, color: THEME.gold, textShadowColor: 'rgba(255,215,106,0.6)', textShadowRadius: 18 },
  pausedHint: {
    position: 'absolute',
    bottom: '18%',
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: 'rgba(10,8,24,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  ssrConfirmText: { fontSize: 22, fontWeight: '900', color: '#ffd76a', marginBottom: 6 },
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(10,8,24,0.55)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  skipBtnText: { color: '#cfc8ea', fontSize: 12, fontWeight: '700' },
  multiFlashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  revealCardWrap: { alignItems: 'center', justifyContent: 'center' },
  revealGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.35,
  },
  revealFrame: {
    width: 250,
    minHeight: 222,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'rgba(30,20,58,0.85)',
    borderRadius: 16,
    borderWidth: 2,
  },
  revealEmoji: { fontSize: 44, marginBottom: 6 },
  rarityBadgeLarge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  rarityBadgeLargeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  revealName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  revealProgress: { position: 'absolute', top: 24, color: '#c4c4d4', fontSize: 13, fontWeight: '700' },
  revealSSRText: { position: 'absolute', top: 70 },
  revealHint: { position: 'absolute', bottom: 40, color: '#8a80b0', fontSize: 12, fontWeight: '700' },
});
