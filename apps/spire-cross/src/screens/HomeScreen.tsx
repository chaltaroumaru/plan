import React, { useMemo, useState } from 'react';
import { ImageBackground, LayoutChangeEvent, StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { AP_MAX, playerRankExpToNext } from '../data/economy';
import { recoverAp } from '../game/ap';
import { getMissions } from '../game/missions';
import { ANNOUNCEMENTS } from '../data/announcements';
import Bar from '../components/Bar';
import AppBackground, { HOME_IMAGE_ASPECT_RATIO, THEME } from '../components/AppBackground';
import HomeMapHotspots from '../components/HomeMapHotspots';
import AnimatedMagicCircle from '../components/AnimatedMagicCircle';

const FRAME_MAX_WIDTH = 480;

export default function HomeScreen({ navigation }: any) {
  const { profile } = useGame();
  const ap = useMemo(() => recoverAp(profile.ap), [profile.ap]);
  const [mapWidth, setMapWidth] = useState(0);
  const { width: windowWidth } = useWindowDimensions();

  const onMapLayout = (e: LayoutChangeEvent) => setMapWidth(e.nativeEvent.layout.width);
  const mapHeight = mapWidth / HOME_IMAGE_ASPECT_RATIO;
  const frameWidth = Math.min(windowWidth, FRAME_MAX_WIDTH) - 32;

  const missions = getMissions(profile);
  const missionsRemaining = missions.filter((m) => !m.done).length;
  const latestAnnouncement = ANNOUNCEMENTS[0];
  const rankExpNext = playerRankExpToNext(profile.playerRank);

  return (
    <View style={styles.root} onLayout={onMapLayout}>
      <AppBackground />

      {mapWidth > 0 && (
        <>
          <HomeMapHotspots
            width={mapWidth}
            imageAspectRatio={HOME_IMAGE_ASPECT_RATIO}
            onNavigate={(target) => navigation.navigate(target)}
          />
          <AnimatedMagicCircle
            areaWidth={mapWidth}
            areaHeight={mapHeight}
            onPress={() => navigation.navigate('ガチャ')}
          />
        </>
      )}

      <SafeAreaView style={styles.safe} edges={['top']} pointerEvents="box-none">
        <View style={styles.topFrameWrap} pointerEvents="box-none">
          <ImageBackground
            source={require('../../assets/ui/ornate_frame.png')}
            style={[styles.topFrame, { width: frameWidth }]}
            imageStyle={styles.frameImage}
            resizeMode="stretch"
          >
            <View style={styles.topFrameRow}>
              <View style={styles.playerCol}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {profile.traveler?.name ?? '旅人'}
                </Text>
                <Text style={styles.rankText}>
                  Rank {profile.playerRank}
                </Text>
                <Bar value={profile.playerExp} max={rankExpNext} color={THEME.gold} height={7} />
                <Text style={styles.rankExpText}>
                  {profile.playerExp}/{rankExpNext}
                </Text>
              </View>
              <View style={styles.walletCol}>
                <View style={styles.walletChip}>
                  <Text style={styles.walletEmoji}>💰</Text>
                  <Text style={styles.walletText}>{profile.gold}</Text>
                </View>
                <View style={styles.walletChip}>
                  <Text style={styles.walletEmoji}>💎</Text>
                  <Text style={styles.walletText}>{profile.stones}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.secondRow} pointerEvents="box-none">
          <View style={styles.staminaBox}>
            <Text style={styles.staminaLabel}>スタミナ</Text>
            <Bar value={ap.current} max={AP_MAX} color={THEME.violet} height={8} />
            <Text style={styles.staminaText}>
              {ap.current}/{AP_MAX}
            </Text>
          </View>

          <Pressable onPress={() => navigation.navigate('お知らせ')}>
            <ImageBackground
              source={require('../../assets/ui/ornate_frame.png')}
              style={styles.frameCard}
              imageStyle={styles.frameImage}
              resizeMode="stretch"
            >
              <Text style={styles.frameEmoji}>📢</Text>
              <Text style={styles.frameLabel}>お知らせ</Text>
              {latestAnnouncement && (
                <Text style={styles.framePreview} numberOfLines={1}>
                  {latestAnnouncement.title}
                </Text>
              )}
              <View style={styles.frameBadge}>
                <Text style={styles.frameBadgeText}>{ANNOUNCEMENTS.length}</Text>
              </View>
            </ImageBackground>
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.missionFloating} pointerEvents="box-none">
        <Pressable onPress={() => navigation.navigate('ミッション')}>
          <ImageBackground
            source={require('../../assets/ui/ornate_frame.png')}
            style={styles.frameCard}
            imageStyle={styles.frameImage}
            resizeMode="stretch"
          >
            <Text style={styles.frameEmoji}>📋</Text>
            <Text style={styles.frameLabel}>ミッション</Text>
            <Text style={styles.framePreview}>残り{missionsRemaining}件</Text>
            {missionsRemaining > 0 && (
              <View style={styles.frameBadge}>
                <Text style={styles.frameBadgeText}>{missionsRemaining}</Text>
              </View>
            )}
          </ImageBackground>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topFrameWrap: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },
  topFrame: { height: 108, padding: 14, justifyContent: 'center' },
  frameImage: { borderRadius: 8 },
  topFrameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerCol: { flex: 1.5 },
  playerName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  rankText: { color: THEME.gold, fontSize: 11, fontWeight: '700', marginTop: 2, marginBottom: 4 },
  rankExpText: { color: THEME.lavender, fontSize: 9, marginTop: 3 },
  walletCol: { flex: 1, gap: 6 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,24,0.55)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  walletEmoji: { fontSize: 12 },
  walletText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  staminaBox: {
    width: '55%',
    backgroundColor: 'rgba(20,14,42,0.72)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  staminaLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  staminaText: { color: THEME.lavender, fontSize: 10, marginTop: 4 },
  missionFloating: { position: 'absolute', left: 16, top: '44%' },
  frameCard: { width: 150, height: 133, alignItems: 'center', justifyContent: 'center', padding: 10 },
  frameEmoji: { fontSize: 18, marginBottom: 2 },
  frameLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  framePreview: {
    color: '#dfe8ff',
    fontSize: 9,
    marginTop: 4,
    maxWidth: 110,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  frameBadge: {
    position: 'absolute',
    top: 6,
    right: 10,
    backgroundColor: THEME.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  frameBadgeText: { color: '#1b1040', fontSize: 9, fontWeight: '800' },
});
