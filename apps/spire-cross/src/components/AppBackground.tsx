import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

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
const IMAGE_ASPECT_RATIO = 940 / 1672;

/**
 * 交界石の世界観(境界が交わる神秘的な塔)を表現する共通背景。
 * AI生成イラスト(assets/backgrounds/home_background.jpg)を、
 * 画面幅いっぱい・上端揃えで敷く(はみ出す下部は元々暗い余白なので切れても目立たない)。
 * 下部はさらにグラデーションで暗くしてUIの視認性を確保している。
 */
export default function AppBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Image
        source={require('../../assets/backgrounds/home_background.jpg')}
        style={[styles.image, { aspectRatio: IMAGE_ASPECT_RATIO }]}
        resizeMode="cover"
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={THEME.bgBottom} stopOpacity={0} />
            <Stop offset="0.55" stopColor={THEME.bgBottom} stopOpacity={0.35} />
            <Stop offset="1" stopColor={THEME.bgBottom} stopOpacity={0.85} />
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
    width: '100%',
  },
});
