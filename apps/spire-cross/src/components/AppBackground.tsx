import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

export const THEME = {
  bgTop: '#1b1040',
  bgMid: '#140f30',
  bgBottom: '#0a0818',
  violet: '#7c5cff',
  teal: '#4fd8c4',
  gold: '#ffd76a',
  lavender: '#c9b8ff',
};

const STARS = [
  { x: 8, y: 6, r: 0.5, c: THEME.gold },
  { x: 22, y: 14, r: 0.35, c: THEME.lavender },
  { x: 40, y: 5, r: 0.4, c: THEME.teal },
  { x: 63, y: 10, r: 0.3, c: THEME.gold },
  { x: 80, y: 18, r: 0.5, c: THEME.lavender },
  { x: 92, y: 8, r: 0.35, c: THEME.teal },
  { x: 12, y: 30, r: 0.3, c: THEME.lavender },
  { x: 30, y: 24, r: 0.25, c: THEME.gold },
  { x: 55, y: 32, r: 0.45, c: THEME.teal },
  { x: 74, y: 27, r: 0.3, c: THEME.lavender },
  { x: 88, y: 34, r: 0.4, c: THEME.gold },
  { x: 5, y: 55, r: 0.35, c: THEME.teal },
  { x: 18, y: 62, r: 0.3, c: THEME.lavender },
  { x: 45, y: 58, r: 0.25, c: THEME.gold },
  { x: 68, y: 64, r: 0.4, c: THEME.lavender },
  { x: 85, y: 57, r: 0.3, c: THEME.teal },
  { x: 10, y: 80, r: 0.4, c: THEME.gold },
  { x: 35, y: 86, r: 0.3, c: THEME.lavender },
  { x: 60, y: 82, r: 0.35, c: THEME.teal },
  { x: 90, y: 88, r: 0.3, c: THEME.gold },
];

/**
 * 交界石の世界観(境界が交わる神秘的な塔)を表現する共通背景。
 * AI画像が用意できるまでの暫定ビジュアルとして、グラデーション+塔/交差モチーフ+星屑で構成。
 */
export default function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={THEME.bgTop} />
            <Stop offset="0.45" stopColor={THEME.bgMid} />
            <Stop offset="1" stopColor={THEME.bgBottom} />
          </LinearGradient>
          <RadialGradient id="portalGlow" cx="0.5" cy="0.16" r="0.5">
            <Stop offset="0" stopColor={THEME.violet} stopOpacity={0.55} />
            <Stop offset="0.6" stopColor={THEME.violet} stopOpacity={0.12} />
            <Stop offset="1" stopColor={THEME.violet} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="tealGlow" cx="0.82" cy="0.62" r="0.4">
            <Stop offset="0" stopColor={THEME.teal} stopOpacity={0.25} />
            <Stop offset="1" stopColor={THEME.teal} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={100} height={200} fill="url(#skyGrad)" />
        <Rect x={-20} y={0} width={140} height={90} fill="url(#portalGlow)" />
        <Rect x={0} y={60} width={100} height={120} fill="url(#tealGlow)" />

        {/* 塔(スパイア)のシルエット */}
        <Rect x={44} y={20} width={12} height={130} fill={THEME.bgBottom} opacity={0.55} />
        <Rect x={40} y={32} width={20} height={6} fill={THEME.bgBottom} opacity={0.5} />
        <Rect x={41} y={55} width={18} height={5} fill={THEME.bgBottom} opacity={0.45} />
        <Rect x={42} y={80} width={16} height={5} fill={THEME.bgBottom} opacity={0.4} />

        {/* 境界が交わる(クロス)モチーフ */}
        <Line x1={10} y1={5} x2={90} y2={45} stroke={THEME.lavender} strokeWidth={0.25} opacity={0.22} />
        <Line x1={90} y1={5} x2={10} y2={45} stroke={THEME.gold} strokeWidth={0.25} opacity={0.18} />

        {/* 幾重にも重なる円environ(次元の境界) */}
        <Ellipse cx={50} cy={16} rx={30} ry={9} stroke={THEME.violet} strokeWidth={0.3} fill="none" opacity={0.3} />
        <Ellipse cx={50} cy={16} rx={42} ry={13} stroke={THEME.lavender} strokeWidth={0.2} fill="none" opacity={0.18} />

        {STARS.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={0.8} />
        ))}
      </Svg>
    </View>
  );
}
