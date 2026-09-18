import React from 'react';
import { Platform, Text } from 'react-native';

/**
 * ヒラギノ明朝のような、細く切れのある明朝体をアプリ全体に適用する。
 * 該当フォントが無い端末では、OSが持つ明朝体(Android/Webのserif総称)に
 * フォールバックする。
 *
 * React 19 以降、関数コンポーネントは defaultProps を持てないため
 * `Text.defaultProps` での一括指定はできない。代わりに `React.createElement`
 * を薄くラップし、`Text` が生成されるたびにフォントスタイルを先頭へ差し込む
 * ことで、個々の画面を書き換えずにアプリ全体へ反映させている。
 */
const FONT_FAMILY = Platform.select({
  ios: 'Hiragino Mincho ProN',
  android: 'serif',
  default: '"Hiragino Mincho ProN", "YuMincho", "Yu Mincho", "MS Mincho", serif',
});

let installed = false;

export function installGlobalMinchoFont() {
  if (installed) return;
  installed = true;

  const originalCreateElement = React.createElement;
  // @ts-expect-error: React.createElement の型を保ったまま差し替える
  React.createElement = function patchedCreateElement(type: any, props: any, ...children: any[]) {
    if (type === Text && props) {
      const nextProps = { ...props, style: [{ fontFamily: FONT_FAMILY }, props.style] };
      return originalCreateElement(type, nextProps, ...children);
    }
    return originalCreateElement(type, props, ...children);
  };
}
