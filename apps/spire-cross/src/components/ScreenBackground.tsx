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
  cover = false,
  children,
}: {
  source: ImageSourcePropType;
  /** 画像の 幅/高さ 比率 */
  aspectRatio: number;
  /** 上に重ねる暗幕の濃さ(0〜1)。UIの視認性確保用 */
  dim?: number;
  /**
   * true: 画面全体を覆うよう拡大し、はみ出した部分は上下(または左右)を
   * トリミングする(装飾目的の背景向け。ホットスポットの座標整合は保証しない)。
   * false(既定): 幅基準でスケールし上端を揃える(ホットスポットの座標計算と
   * 一致させたいホーム/ダンジョン塔内部などで使う)。
   */
  cover?: boolean;
  children?: (layout: { width: number; height: number }) => React.ReactNode;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const frameWidth = Math.min(windowWidth, FRAME_MAX_WIDTH);

  if (cover) {
    // 幅基準でスケールした時の高さが画面高さに満たなければ、高さ基準に
    // 切り替えて画面を覆う(CSSのbackground-size:coverと同じ考え方)。
    const heightAtWidthScale = frameWidth / aspectRatio;
    const needsHeightScale = heightAtWidthScale < windowHeight;
    const imgWidth = needsHeightScale ? windowHeight * aspectRatio : frameWidth;
    const imgHeight = needsHeightScale ? windowHeight : heightAtWidthScale;

    return (
      <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="box-none">
        <View style={{ width: frameWidth, height: windowHeight, alignItems: 'center' }} pointerEvents="box-none">
          <Image source={source} style={{ width: imgWidth, height: imgHeight }} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(6,4,16,${dim})` }]} pointerEvents="none" />
          {children?.({ width: frameWidth, height: windowHeight })}
        </View>
      </View>
    );
  }

  const width = frameWidth;
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
