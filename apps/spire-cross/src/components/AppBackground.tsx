import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// App.tsx の `.frame` と同じ上限(スマホ比率へのレターボックス)。
const FRAME_MAX_WIDTH = 480;

export const THEME = {
  bgTop: '#1b1040',
  bgMid: '#140f30',
  bgBottom: '#0a0818',
  violet: '#7c5cff',
  teal: '#4fd8c4',
  gold: '#ffd76a',
  lavender: '#c9b8ff',
};

// 元イラストの実寸比率(幅940 x 高さ1672)。端末ごとの縦横比の違いで
// 塔の見え方がずれないよう、幅基準でスケールして上端を揃える。
// ホーム画面のマップホットスポット(HomeMapHotspots)もこの比率を使って
// イラスト上の建物・魔法陣の座標を計算するため、ここから公開している。
export const HOME_IMAGE_ASPECT_RATIO = 940 / 1672;
const IMAGE_ASPECT_RATIO = HOME_IMAGE_ASPECT_RATIO;

/**
 * 交界石の世界観(境界が交わる神秘的な塔)を表現する共通背景。
 * AI生成イラスト(assets/backgrounds/home_background.jpg)を、
 * 画面幅いっぱい・上端揃えで敷く。
 * イラスト下部には宿・屋台・魔法陣(HomeMapHotspots参照)が描かれているため、
 * ここを暗く潰さないよう、下端フェードはごく控えめ(タブバー付近のみ)に留めている。
 */
export default function AppBackground() {
  // react-native-web では `width:'100%'` + `aspectRatio` の組み合わせで高さが
  // 正しく計算されない(画像の実ピクセル高さがそのまま使われ、下部が画面外に
  // はみ出す)ことがあるため、幅から高さを明示的に計算して指定する。
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width, FRAME_MAX_WIDTH);
  const imageHeight = frameWidth / IMAGE_ASPECT_RATIO;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Image
        source={require('../../assets/backgrounds/home_background.jpg')}
        style={[styles.image, { width: frameWidth, height: imageHeight }]}
        resizeMode="cover"
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={THEME.bgBottom} stopOpacity={0} />
            <Stop offset="0.72" stopColor={THEME.bgBottom} stopOpacity={0.05} />
            <Stop offset="0.92" stopColor={THEME.bgBottom} stopOpacity={0.3} />
            <Stop offset="1" stopColor={THEME.bgBottom} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bottomFade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bgBottom,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
