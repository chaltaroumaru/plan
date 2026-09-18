import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Hotspot = {
  key: string;
  left: number; // ホーム背景イラスト内でのX位置(0〜1)
  top: number; // ホーム背景イラスト内でのY位置(0〜1)
  width: number;
  height: number;
  target: string;
};

// home_background.jpg(拠点全景)上の各建物・地形に重ねる、当たり判定のみの
// 透明な領域。イラスト自体が塔・宿・屋台をはっきり描いているため、
// マーカーやラベルは付けずタップ領域だけを重ねる。
const HOTSPOTS: Hotspot[] = [
  { key: 'dungeon', left: 0.33, top: 0.0, width: 0.34, height: 0.6, target: 'ダンジョン' },
  { key: 'character', left: 0.0, top: 0.58, width: 0.28, height: 0.22, target: 'キャラ' },
  { key: 'shop', left: 0.76, top: 0.6, width: 0.24, height: 0.25, target: 'ショップ' },
];

/**
 * ホーム背景イラスト(home_background.jpg)に重ねる、タップ可能な透明領域。
 * イラストは幅基準・上端揃えで表示されるため(AppBackground参照)、
 * 渡された画面幅から同じ比率でイラストの表示高さを逆算し、
 * 各領域の座標(left/top/width/height)をその範囲内のピクセル位置に変換して配置する。
 */
export default function HomeMapHotspots({
  width,
  imageAspectRatio,
  onNavigate,
}: {
  width: number;
  imageAspectRatio: number;
  onNavigate: (target: string) => void;
}) {
  const imageHeight = width / imageAspectRatio;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {HOTSPOTS.map((spot) => (
        <Pressable
          key={spot.key}
          onPress={() => onNavigate(spot.target)}
          style={{
            position: 'absolute',
            left: width * spot.left,
            top: imageHeight * spot.top,
            width: width * spot.width,
            height: imageHeight * spot.height,
          }}
        />
      ))}
    </View>
  );
}
