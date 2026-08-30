# plan

新規アプリ2本のプロトタイプを収録したリポジトリです。いずれも React Native (Expo) + TypeScript 製で、データは端末内 (AsyncStorage) に保存されます (サーバー/アカウント登録なし)。

## apps/spire-cross — スパイア・クロス

「スレイ・ザ・スパイア」風のデッキ構築ローグライク戦闘 × 「グランドクロス」風のキャラクターガチャを組み合わせた、1人用ソシャゲ風プロトタイプ。詳細は [`apps/spire-cross/README.md`](apps/spire-cross/README.md)。

## apps/koibito-memo — 恋人メモ

記念日・プレゼント・化粧品・好きなもの・生理周期をまとめて管理する1人用メモアプリ。詳細は [`apps/koibito-memo/README.md`](apps/koibito-memo/README.md)。

## それぞれの起動方法

```bash
cd apps/spire-cross   # または apps/koibito-memo
npm install
npm run web            # ブラウザで起動
```
