import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useGame } from '../state/GameContext';
import { getCharacter, RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import { GachaPoolKind, GachaPullResult } from '../types';
import { MULTI_PULL_COUNT, PITY_LIMIT, SINGLE_PULL_COST, TEN_PULL_COST, pullGacha } from '../game/gacha';

type MultiPhase = 'idle' | 'video' | 'burst' | 'reveal';

type GlowKind = 'SSR' | 'SR' | 'normal';

const GLOW_COLOR: Record<GlowKind, string> = {
  SSR: '#ffd76a',
  SR: '#b164e8',
  normal: '#c9b8ff',
};

const SUMMON_LABEL: Record<GlowKind, string> = {
  SSR: '眩い想いが塔を駆け上る……!',
  SR: '強い想いが塔を駆け上る……',
  normal: '交界石の記憶が塔を駆け上る……',
};

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
  const [shardPulls, setShardPulls] = useState<GachaPullResult[] | null>(null);
  const [showSSRText, setShowSSRText] = useState(false);
  const [glowKind, setGlowKind] = useState<GlowKind>('normal');
  const [overlayHeight, setOverlayHeight] = useState(640);
  const [overlayWidth, setOverlayWidth] = useState(360);

  const climbAnim = useRef(new Animated.Value(0)).current;
  const ssrRevealAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const cardAnimsRef = useRef<Animated.Value[]>([]);
  const cardFlashRef = useRef<Animated.Value[]>([]);
  const shardAnimsRef = useRef<Animated.Value[]>([]);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ssrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPullsRef = useRef<GachaPullResult[] | null>(null);

  // 10+1連: 動画(塔→星の放出→魔法陣へ着地)の後、タップで星が11個に分裂→
  // 白い光→1体ずつキャラクターを表示、という専用の演出フロー。
  const [multiPhase, setMultiPhase] = useState<MultiPhase>('idle');
  const [multiPulls, setMultiPulls] = useState<GachaPullResult[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [multiOverlaySize, setMultiOverlaySize] = useState({ width: 360, height: 640 });
  const multiPullsRef = useRef<GachaPullResult[] | null>(null);
  const multiPhaseRef = useRef<MultiPhase>('idle');
  const burstShardAnimsRef = useRef<Animated.Value[]>([]);
  const burstFlashAnim = useRef(new Animated.Value(0)).current;
  const cardTintAnim = useRef(new Animated.Value(0)).current;
  const revealCardAnim = useRef(new Animated.Value(0)).current;

  const multiPlayer = useVideoPlayer(require('../../assets/video/gacha_multi_pull.mp4'), (player) => {
    player.loop = false;
    player.muted = true;
  });

  useEffect(() => {
    multiPhaseRef.current = multiPhase;
  }, [multiPhase]);

  useEventListener(multiPlayer, 'playToEnd', () => {
    if (multiPhaseRef.current === 'video') startBurst();
  });

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
    if (count === MULTI_PULL_COUNT) {
      startMultiSummon(outcome.pulls);
    } else {
      startSummonSequence(outcome.pulls);
    }
  };

  // 10+1連専用: 動画(塔→星の放出→魔法陣へ着地)を再生する。
  const startMultiSummon = (pulls: GachaPullResult[]) => {
    multiPullsRef.current = pulls;
    setMultiPulls(pulls);
    setRevealIndex(-1);
    setMultiPhase('video');
    multiPlayer.currentTime = 0;
    multiPlayer.play();
  };

  // 動画終了(または途中タップ)→星が割れて11個に分裂→白い光、の演出。
  const startBurst = () => {
    const pulls = multiPullsRef.current;
    if (!pulls) return;
    multiPlayer.pause();
    setMultiPhase('burst');
    burstFlashAnim.setValue(0);
    burstShardAnimsRef.current = pulls.map(() => new Animated.Value(0));
    Animated.stagger(
      45,
      burstShardAnimsRef.current.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true })
      )
    ).start(() => {
      Animated.timing(burstFlashAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start(() => {
        setMultiPhase('reveal');
        setRevealIndex(0);
        playRevealCard(pulls, 0);
      });
    });
  };

  // 分裂後の光が晴れて、キャラクターを1体ずつ表示する演出。
  const playRevealCard = (pulls: GachaPullResult[], index: number) => {
    const pull = pulls[index];
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

  // タップで次のキャラへ。11体目まで見終えたら通常の結果画面(グリッド)へ。
  const advanceReveal = () => {
    const pulls = multiPullsRef.current;
    if (!pulls) return;
    const next = revealIndex + 1;
    if (next >= pulls.length) {
      setMultiPhase('idle');
      setShowSSRText(false);
      multiPullsRef.current = null;
      setMultiPulls(null);
      setRevealIndex(-1);
      revealResults(pulls);
      return;
    }
    setRevealIndex(next);
    playRevealCard(pulls, next);
  };

  const revealResults = (pulls: GachaPullResult[]) => {
    setSummoning(false);
    setShowSSRText(false);
    setShardPulls(null);
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
    setShardPulls(pulls);
    pendingPullsRef.current = pulls;

    climbAnim.setValue(0);
    ssrRevealAnim.setValue(0);
    shakeAnim.setValue(0);
    shardAnimsRef.current = pulls.map(() => new Animated.Value(0));

    const climbDuration = kind === 'SSR' ? 1500 : kind === 'SR' ? 1150 : 900;

    // 塔が下から上へ光って駆け上る(高さ/位置を動かすのでuseNativeDriverは使えない)
    Animated.timing(climbAnim, {
      toValue: 1,
      duration: climbDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      // 頂上に到達 → 記憶のかけらが弾け飛ぶ
      if (kind === 'SSR') {
        setShowSSRText(true);
        Animated.spring(ssrRevealAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();
      }
      Animated.stagger(
        60,
        shardAnimsRef.current.map((v) =>
          Animated.timing(v, { toValue: 1, duration: 560, easing: Easing.out(Easing.quad), useNativeDriver: true })
        )
      ).start(() => {
        revealTimerRef.current = setTimeout(() => {
          const pending = pendingPullsRef.current;
          pendingPullsRef.current = null;
          if (pending) revealResults(pending);
        }, 450);
      });
    });
  };

  const skipSummon = () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (ssrTimerRef.current) clearTimeout(ssrTimerRef.current);
    climbAnim.stopAnimation();
    shardAnimsRef.current.forEach((v) => v.stopAnimation());
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
          <Pressable style={styles.pullBtn} onPress={() => doPull(1)} disabled={summoning || multiPhase !== 'idle'}>
            <Text style={styles.pullBtnText}>1回引く</Text>
            <Text style={styles.pullBtnSub}>💎{SINGLE_PULL_COST}</Text>
          </Pressable>
          <Pressable
            style={[styles.pullBtn, styles.pullBtnTen]}
            onPress={() => doPull(MULTI_PULL_COUNT)}
            disabled={summoning || multiPhase !== 'idle'}
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

      {summoning && (
        <View
          style={styles.summonOverlay}
          onLayout={(e) => {
            setOverlayHeight(e.nativeEvent.layout.height);
            setOverlayWidth(e.nativeEvent.layout.width);
          }}
        >
          {/* 塔を駆け上る光の柱 */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: overlayWidth / 2 - 22,
              width: 44,
              borderRadius: 22,
              backgroundColor: glowColor,
              opacity: 0.32,
              height: climbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, overlayHeight] }),
            }}
          />
          {/* 光の柱の先端(駆け上る光そのもの) */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: overlayWidth / 2 - 30,
              bottom: climbAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, overlayHeight - 30] }),
            }}
          >
            <Svg width={60} height={60}>
              <Defs>
                <RadialGradient id="climbHead" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#ffffff" stopOpacity={1} />
                  <Stop offset="0.5" stopColor={glowColor} stopOpacity={0.85} />
                  <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={30} cy={30} r={30} fill="url(#climbHead)" />
            </Svg>
          </Animated.View>

          {/* 頂上ではじける記憶のかけら(引いた数だけ、それぞれレアリティ色) */}
          {shardPulls?.map((p, idx) => {
            const v = shardAnimsRef.current[idx] ?? new Animated.Value(0);
            const isSSR = p.rarity === 'SSR';
            const count = shardPulls.length;
            const spread = (idx - (count - 1) / 2) * Math.min(26, (overlayWidth - 60) / Math.max(count, 1));
            const fallDistance = 64 + (idx % 3) * 18;
            return (
              <Animated.View
                key={idx}
                testID={`shard-${idx}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: overlayWidth / 2 - 12,
                  bottom: overlayHeight - 40,
                  opacity: v.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] }),
                  transform: [
                    { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, spread] }) },
                    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, fallDistance] }) },
                    {
                      scale: v.interpolate({
                        inputRange: [0, 0.25, 1],
                        outputRange: [0.2, isSSR ? 1.35 : 1, isSSR ? 1.2 : 0.92],
                      }),
                    },
                  ],
                }}
              >
                <Text style={{ fontSize: isSSR ? 26 : 18, color: RARITY_COLOR[p.rarity] }}>◆</Text>
              </Animated.View>
            );
          })}

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

          <Animated.Text
            style={[
              styles.summonText,
              { color: glowColor, transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
            ]}
          >
            {SUMMON_LABEL[glowKind]}
          </Animated.Text>

          <Pressable style={styles.skipBtn} onPress={skipSummon}>
            <Text style={styles.skipBtnText}>タップでスキップ ▶</Text>
          </Pressable>
        </View>
      )}

      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flashAnim, backgroundColor: glowColor }]}
      />

      {multiPhase !== 'idle' && (
        <View
          style={styles.multiOverlay}
          onLayout={(e) => setMultiOverlaySize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          {multiPhase === 'video' && (
            <VideoView
              player={multiPlayer}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
              pointerEvents="none"
            />
          )}

          {multiPhase === 'burst' &&
            multiPulls?.map((p, idx) => {
              const v = burstShardAnimsRef.current[idx] ?? new Animated.Value(0);
              const isSSR = p.rarity === 'SSR';
              const angle = (idx / multiPulls.length) * Math.PI * 2;
              const dist = 90 + (idx % 3) * 22;
              const dx = Math.cos(angle) * dist;
              const dy = Math.sin(angle) * dist * 0.6;
              return (
                <Animated.View
                  key={idx}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: multiOverlaySize.width / 2 - 12,
                    top: multiOverlaySize.height * 0.72 - 12,
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

          {multiPhase === 'reveal' &&
            multiPulls &&
            revealIndex >= 0 &&
            (() => {
              const p = multiPulls[revealIndex];
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
                      styles.revealCard,
                      { borderColor: RARITY_COLOR[p.rarity] },
                      {
                        opacity: revealCardAnim,
                        transform: [{ scale: revealCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                      },
                    ]}
                  >
                    <Text style={styles.revealEmoji}>{emoji}</Text>
                    <View style={[styles.rarityBadgeLarge, { backgroundColor: RARITY_COLOR[p.rarity] }]}>
                      <Text style={styles.rarityBadgeLargeText}>{p.rarity}</Text>
                    </View>
                    <Text style={styles.revealName}>{name}</Text>
                    {p.isNew ? (
                      <Text style={styles.newTag}>NEW!</Text>
                    ) : (
                      <Text style={styles.dupeTag}>{p.pool === 'character' ? '重複→ゴールド' : '所持数+1'}</Text>
                    )}
                  </Animated.View>
                  <Text style={styles.revealProgress}>
                    {revealIndex + 1} / {multiPulls.length}
                  </Text>
                  {showSSRText && (
                    <Animated.Text
                      style={[
                        styles.ssrConfirmText,
                        styles.revealSSRText,
                        {
                          opacity: ssrRevealAnim,
                          transform: [{ scale: ssrRevealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
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

          <Animated.View
            pointerEvents="none"
            style={[styles.multiFlashOverlay, { opacity: burstFlashAnim }]}
          />

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (multiPhase === 'video') startBurst();
              else if (multiPhase === 'reveal') advanceReveal();
            }}
          />
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
  summonOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,4,16,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingBottom: 36,
  },
  ssrConfirmText: { fontSize: 22, fontWeight: '900', color: '#ffd76a', marginBottom: 6 },
  summonText: { fontSize: 14, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  skipBtnText: { color: '#8a80b0', fontSize: 12, fontWeight: '700' },
  flashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  multiOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  multiFlashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  revealCard: {
    width: 220,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: 'rgba(20,14,42,0.85)',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  revealEmoji: { fontSize: 56, marginBottom: 10 },
  rarityBadgeLarge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  rarityBadgeLargeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  revealName: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  revealProgress: { position: 'absolute', top: 24, color: '#c4c4d4', fontSize: 13, fontWeight: '700' },
  revealSSRText: { position: 'absolute', top: 70 },
  revealHint: { position: 'absolute', bottom: 40, color: '#8a80b0', fontSize: 12, fontWeight: '700' },
});
