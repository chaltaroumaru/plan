import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View, useWindowDimensions } from 'react-native';
import { THEME } from './AppBackground';

const FRAME_MAX_WIDTH = 480;

/**
 * 個別画面(ダンジョン/キャラ/ガチャ等)専用の背景イラストを、画面幅いっぱい・
 * 上端揃えで敷く共通コンポーネント。AppBackground と同じ理由(react-native-web
 * で width:'100%'+aspectRatio の組み合わせだと高さが実ピクセル値のまま使われる
 * バグがある)で、幅から高さを明示計算する方式にしている。
 *
 * onLayout で自身の幅を計測し、ホットスポット等の子要素にそのまま渡せるよう
 * children をレンダープロップ形式で受け取る。
 */
export default function ScreenBackground({
  source,
  aspectRatio,
  dim = 0.35,
  children,
}: {
  source: ImageSourcePropType;
  /** 画像の 幅/高さ 比率 */
  aspectRatio: number;
  /** 上に重ねる暗幕の濃さ(0〜1)。UIの視認性確保用 */
  dim?: number;
  children?: (layout: { width: number; height: number }) => React.ReactNode;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, FRAME_MAX_WIDTH);
  const height = width / aspectRatio;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="box-none">
      <View style={{ width, height }} pointerEvents="box-none">
        <Image source={source} style={{ width, height }} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(6,4,16,${dim})` }]} pointerEvents="none" />
        {children?.({ width, height })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bgBottom,
    overflow: 'hidden',
  },
});
