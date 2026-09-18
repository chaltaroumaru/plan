import React, { useMemo, useState } from 'react';
import { ImageBackground, LayoutChangeEvent, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { AP_MAX } from '../data/economy';
import { recoverAp } from '../game/ap';
import { getMissions } from '../game/missions';
import { ANNOUNCEMENTS } from '../data/announcements';
import Bar from '../components/Bar';
import AppBackground, { HOME_IMAGE_ASPECT_RATIO, THEME } from '../components/AppBackground';
import HomeMapHotspots from '../components/HomeMapHotspots';
import AnimatedMagicCircle from '../components/AnimatedMagicCircle';

export default function HomeScreen({ navigation }: any) {
  const { profile } = useGame();
  const ap = useMemo(() => recoverAp(profile.ap), [profile.ap]);
  const [mapWidth, setMapWidth] = useState(0);

  const onMapLayout = (e: LayoutChangeEvent) => setMapWidth(e.nativeEvent.layout.width);
  const mapHeight = mapWidth / HOME_IMAGE_ASPECT_RATIO;

  const missions = getMissions(profile);
  const missionsRemaining = missions.filter((m) => !m.done).length;
  const latestAnnouncement = ANNOUNCEMENTS[0];

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
        <View style={styles.headerRow} pointerEvents="box-none">
          <View style={styles.playerBox}>
            <Text style={styles.playerText}>パーティ平均 Lv{avgLevel(profile)}</Text>
            <Bar value={ap.current} max={AP_MAX} color={THEME.violet} height={8} />
            <Text style={styles.apText}>
              AP {ap.current}/{AP_MAX}
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

        <View style={styles.frameRow} pointerEvents="box-none">
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
      </SafeAreaView>
    </View>
  );
}

function avgLevel(profile: ReturnType<typeof useGame>['profile']) {
  const levels = profile.partyIds
    .map((id) => profile.characterProgress[id]?.level)
    .filter((l): l is number => typeof l === 'number');
  return levels.length > 0 ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : 0;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, alignItems: 'flex-start' },
  playerBox: {
    flex: 1.2,
    backgroundColor: 'rgba(20,14,42,0.72)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  playerText: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  apText: { color: THEME.lavender, fontSize: 10, marginTop: 4 },
  walletCol: { flex: 1, gap: 6 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,14,42,0.72)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  walletEmoji: { fontSize: 13 },
  walletText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  frameRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  frameCard: { width: 150, height: 133, alignItems: 'center', justifyContent: 'center', padding: 10 },
  frameImage: { borderRadius: 8 },
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
