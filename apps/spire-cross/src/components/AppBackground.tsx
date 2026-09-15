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

/**
 * 交界石の世界観(境界が交わる神秘的な塔)を表現する共通背景。
 * AI生成イラスト(assets/backgrounds/home_background.jpg)を全画面に敷き、
 * 下部はUIの視認性を確保するためグラデーションでさらに暗くしている。
 */
export default function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../assets/backgrounds/home_background.jpg')}
        style={StyleSheet.absoluteFill}
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
