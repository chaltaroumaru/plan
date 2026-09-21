import React from 'react';
import { StyleSheet, View } from 'react-native';

export const THEME = {
  bgTop: '#1b1040',
  bgMid: '#140f30',
  bgBottom: '#0a0818',
  violet: '#7c5cff',
  teal: '#4fd8c4',
  gold: '#ffd76a',
  lavender: '#c9b8ff',
};

// ホームのマップホットスポット(HomeMapHotspots)が配置比率の基準に使う値。
// イラスト背景を使っていた頃の名残の比率で、見た目に対応する画像は無いが、
// 各ホットスポットの縦位置の割り振りをそのまま保つために残している。
export const HOME_IMAGE_ASPECT_RATIO = 940 / 1674;

/**
 * 紫単色の共通背景。UIや演出は作り直し予定のため、AI生成イラストや
 * 装飾は使わず、THEME準拠の単色で敷くだけのシンプルな状態にしている。
 */
export default function AppBackground() {
  return <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bgTop,
  },
});
