import React, { useState } from 'react';
import { Image, LayoutChangeEvent, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { CharacterDef } from '../types';
import { useGame } from '../state/GameContext';
import { RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import { getCharacterArt } from '../data/characterArt';
import { expForNextLevel } from '../game/leveling';
import Bar from '../components/Bar';

// issueで届いた「キャラクター枠」画像(941x1672)のレイアウトに合わせた、
// 各要素の相対位置(0〜1)。frame自体は上部バナー→絵窓→3つの情報ボックス
// (1番目と3番目は縦線で2カラムに分かれる)という構成。
// HomeMapHotspots と同じ「測定した実幅から高さを逆算し、ピクセルで配置する」
// 方式を採用する(Viewにaspectio指定+子を%指定するとRN Web上で高さが
// 正しく反映されない不具合があったため)。
const FRAME_ASPECT_RATIO = 941 / 1672;

type Rect = { left: number; top: number; width: number; height: number };

const BANNER: Rect = { left: 0.2, top: 0.015, width: 0.62, height: 0.07 };
const PICTURE: Rect = { left: 0.05, top: 0.1, width: 0.9, height: 0.335 };
const BOX1_HEADER: Rect = { left: 0.06, top: 0.465, width: 0.4, height: 0.03 };
const BOX1_BODY: Rect = { left: 0.07, top: 0.51, width: 0.86, height: 0.12 };
const BOX2_HEADER: Rect = { left: 0.06, top: 0.655, width: 0.4, height: 0.03 };
const BOX2_BODY: Rect = { left: 0.07, top: 0.7, width: 0.86, height: 0.09 };
const BOX3_HEADER: Rect = { left: 0.06, top: 0.815, width: 0.4, height: 0.03 };
const BOX3_LEFT: Rect = { left: 0.07, top: 0.86, width: 0.4, height: 0.08 };
const BOX3_RIGHT: Rect = { left: 0.53, top: 0.86, width: 0.4, height: 0.08 };

function toPx(rect: Rect, width: number, height: number) {
  return {
    position: 'absolute' as const,
    left: rect.left * width,
    top: rect.top * height,
    width: rect.width * width,
    height: rect.height * height,
  };
}

export default function CharacterDetailView({
  character,
  onBack,
  onOpenSkillTree,
}: {
  character: CharacterDef;
  onBack: () => void;
  onOpenSkillTree: (character: CharacterDef) => void;
}) {
  const { profile } = useGame();
  const progress = profile.characterProgress[character.id];
  const [frameWidth, setFrameWidth] = useState(0);

  if (!progress) {
    return null;
  }

  // 旅人(プレイヤー作成キャラ)は専用カードを持たない(signatureCardId: '')
  const signatureCard = character.signatureCardId ? getCard(character.signatureCardId) : null;
  const ownsSignatureCard = (profile.ownedCardCounts[character.signatureCardId] ?? 0) > 0;
  const art = getCharacterArt(character.id);

  const onFrameLayout = (e: LayoutChangeEvent) => setFrameWidth(e.nativeEvent.layout.width);
  const frameHeight = frameWidth / FRAME_ASPECT_RATIO;

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← キャラ一覧に戻る</Text>
      </Pressable>

      <View style={[styles.frameWrap, { height: frameHeight || undefined }]} onLayout={onFrameLayout}>
        <Image
          source={require('../../assets/ui/character_frame.png')}
          style={{ width: frameWidth, height: frameHeight }}
          resizeMode="stretch"
        />

        {frameWidth > 0 && (
          <>
            <View style={toPx(BANNER, frameWidth, frameHeight)}>
              <Text style={styles.name} numberOfLines={1}>
                {character.name}
              </Text>
              <Text style={styles.title} numberOfLines={1}>
                {character.title} ・ {character.element}属性
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[character.rarity] }]}>
                <Text style={styles.rarityText}>{character.rarity}</Text>
              </View>
            </View>

            <View style={[toPx(PICTURE, frameWidth, frameHeight), styles.pictureArea]}>
              {art ? (
                <Image source={art} style={styles.art} resizeMode="contain" />
              ) : (
                <Text style={styles.emoji}>{character.emoji}</Text>
              )}
            </View>

            <View style={toPx(BOX1_HEADER, frameWidth, frameHeight)}>
              <Text style={styles.boxHeaderText}>ステータス</Text>
            </View>
            <View style={[toPx(BOX1_BODY, frameWidth, frameHeight), styles.boxBody]}>
              <Text style={styles.levelText}>
                Lv.{progress.level} ・ スキルポイント {progress.skillPoints}
              </Text>
              <Bar value={progress.exp} max={expForNextLevel(progress.level)} color="#f5b400" height={8} />
              <Text style={styles.expText}>
                EXP {progress.exp}/{expForNextLevel(progress.level)}
              </Text>
            </View>

            <View style={toPx(BOX2_HEADER, frameWidth, frameHeight)}>
              <Text style={styles.boxHeaderText}>専用カード</Text>
            </View>
            <View style={[toPx(BOX2_BODY, frameWidth, frameHeight), styles.boxBody]}>
              {signatureCard ? (
                <Text style={styles.signatureText}>
                  {signatureCard.name}({signatureCard.description}) を
                  {ownsSignatureCard ? '所持しています' : '所持していません'}
                </Text>
              ) : (
                <Text style={styles.signatureText}>このキャラクターは専用カードを持ちません。</Text>
              )}
            </View>

            <View style={toPx(BOX3_HEADER, frameWidth, frameHeight)}>
              <Text style={styles.boxHeaderText}>プロフィール</Text>
            </View>
            <View style={[toPx(BOX3_LEFT, frameWidth, frameHeight), styles.boxBody]}>
              <Text style={styles.profileLabel}>属性</Text>
              <Text style={styles.profileValue}>{character.element}</Text>
            </View>
            <View style={[toPx(BOX3_RIGHT, frameWidth, frameHeight), styles.boxBody]}>
              <Text style={styles.profileLabel}>レアリティ</Text>
              <Text style={styles.profileValue}>{character.rarity}</Text>
            </View>
          </>
        )}
      </View>

      <Pressable style={styles.skillTreeBtn} onPress={() => onOpenSkillTree(character)}>
        <Text style={styles.skillTreeBtnText}>🌳 スキルツリーで育成する →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },

  frameWrap: { width: '100%', marginBottom: 16 },

  name: { color: '#fff', fontSize: 17, fontWeight: '800' },
  title: { color: '#bcd4ff', fontSize: 10, marginTop: 1 },
  rarityBadge: {
    position: 'absolute',
    right: -36,
    top: 4,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  pictureArea: { alignItems: 'center', justifyContent: 'center' },
  art: { width: '100%', height: '100%' },
  emoji: { fontSize: 64 },

  boxBody: { justifyContent: 'center', gap: 4 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  expText: { color: '#bcd4ff', fontSize: 10, marginTop: 2 },
  signatureText: { color: '#dfe4ff', fontSize: 11, lineHeight: 16 },
  profileLabel: { color: '#8f9fd8', fontSize: 9 },
  profileValue: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },

  boxHeaderText: { color: '#0c1230', fontSize: 11, fontWeight: '800', marginLeft: 6 },

  skillTreeBtn: { backgroundColor: '#7c5cff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  skillTreeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
