import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { HOME_IMAGE_ASPECT_RATIO } from './AppBackground';

type Hotspot = {
  key: string;
  fx: number; // ホーム背景イラスト内でのX位置(0〜1)
  fy: number; // ホーム背景イラスト内でのY位置(0〜1)
  icon: string;
  label: string;
  target: string;
};

// home_background.jpg(拠点全景)上の各スポットの位置。
// 塔へ続く道の途中(矢印) / 宿(左手前) / 屋台(右手前) / 魔法陣(中央手前)。
const HOTSPOTS: Hotspot[] = [
  { key: 'dungeon', fx: 0.505, fy: 0.65, icon: '⬆️', label: 'ダンジョンへ', target: 'ダンジョン' },
  { key: 'character', fx: 0.117, fy: 0.688, icon: '🏠', label: 'キャラ', target: 'キャラ' },
  { key: 'shop', fx: 0.9, fy: 0.79, icon: '🏪', label: 'ショップ', target: 'ショップ' },
  { key: 'gacha', fx: 0.51, fy: 0.87, icon: '✨', label: 'ガチャ', target: 'ガチャ' },
];

function HotspotMarker({ spot, left, top, onPress }: { spot: Hotspot; left: number; top: number; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.markerWrap, { left, top }]}
      hitSlop={16}
    >
      <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
      <Animated.View style={[styles.badge, { opacity: glowOpacity }]}>
        <Text style={styles.badgeIcon}>{spot.icon}</Text>
      </Animated.View>
      <View style={styles.labelPill}>
        <Text style={styles.labelText}>{spot.label}</Text>
      </View>
    </Pressable>
  );
}

/**
 * ホーム背景イラスト(home_background.jpg)に重ねる、タップ可能なマップUI。
 * イラストは幅基準・上端揃えで表示されるため(AppBackground参照)、
 * 渡された画面幅から同じ比率でイラストの表示高さを逆算し、
 * 各スポットの座標(fx,fy)をその範囲内のピクセル位置に変換して配置する。
 */
export default function HomeMapHotspots({ width, onNavigate }: { width: number; onNavigate: (target: string) => void }) {
  const imageHeight = width / HOME_IMAGE_ASPECT_RATIO;
  const MARKER_HALF = 26;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {HOTSPOTS.map((spot) => (
        <HotspotMarker
          key={spot.key}
          spot={spot}
          left={width * spot.fx - MARKER_HALF}
          top={imageHeight * spot.fy - MARKER_HALF}
          onPress={() => onNavigate(spot.target)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  markerWrap: { position: 'absolute', width: 52, alignItems: 'center' },
  ring: {
    position: 'absolute',
    top: 0,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#ffd76a',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(27,19,48,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,106,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: { fontSize: 20 },
  labelPill: {
    marginTop: 4,
    backgroundColor: 'rgba(10,8,24,0.72)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  labelText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
