import React, { useMemo, useState } from 'react';
import { Alert, ImageSourcePropType, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { DUNGEON_STAGES } from '../data/dungeonStages';
import { DUNGEON_CATEGORY_EMOJI, DUNGEON_CATEGORY_LABEL, MATERIAL_EMOJI, MATERIAL_LABEL, AP_MAX } from '../data/economy';
import { getEnemy } from '../data/enemies';
import { getCharacter } from '../data/characters';
import { CharacterDef, CharacterProgress, DungeonCategory, DungeonStageDef } from '../types';
import { consumeAp, minutesUntilNextAp, recoverAp } from '../game/ap';
import Bar from '../components/Bar';
import BattleView from './BattleView';
import ScreenBackground, { DUNGEON_PANEL_FRAME_TRAINING, PanelFrame, useTopAlignedImageSize } from '../components/ScreenBackground';

/**
 * ダンジョンのステージ一覧+戦闘フロー。「育成ダンジョン」「イベントダンジョン」
 * など、塔内部のパネルから遷移した先の各モードで共通して使う。
 * background を渡すと、一覧画面だけそのモード専用の背景イラストに差し替わる
 * (戦闘中は共通の塔背景のまま)。
 */
export default function DungeonStageListView({
  title,
  categories,
  onBack,
  background,
}: {
  title: string;
  categories: DungeonCategory[];
  onBack: () => void;
  background?: { source: ImageSourcePropType; aspectRatio: number; panelFrame?: PanelFrame };
}) {
  const { profile, updateProfile } = useGame();
  const [activeStage, setActiveStage] = useState<DungeonStageDef | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const ap = useMemo(() => recoverAp(profile.ap), [profile.ap]);
  const minutesLeft = useMemo(() => minutesUntilNextAp(profile.ap), [profile.ap]);
  const imgSize = useTopAlignedImageSize(background?.aspectRatio ?? 1);

  const partyMembers = profile.partyIds
    .map((id) => {
      const character = getCharacter(id);
      const progress = profile.characterProgress[id];
      return character && progress ? { character, progress } : null;
    })
    .filter((v): v is { character: CharacterDef; progress: CharacterProgress } => !!v);

  const startStage = (stage: DungeonStageDef) => {
    if (ap.current < stage.apCost) {
      Alert.alert('APが足りません', `このステージにはAP${stage.apCost}必要です。`);
      return;
    }
    if (partyMembers.length === 0) {
      Alert.alert('パーティが未編成です', 'キャラ画面でパーティを編成してください。');
      return;
    }
    updateProfile((prev) => ({ ...prev, ap: consumeAp(prev.ap, stage.apCost) }));
    setResultText(null);
    setActiveStage(stage);
  };

  const handleFinished = (won: boolean) => {
    if (!activeStage) return;
    if (won) {
      updateProfile((prev) => {
        const materials = { ...prev.materials };
        if (activeStage.rewardMaterial) {
          materials[activeStage.rewardMaterial.type] += activeStage.rewardMaterial.amount;
        }
        return {
          ...prev,
          gold: prev.gold + activeStage.rewardGold,
          stones: prev.stones + activeStage.rewardStones,
          materials,
        };
      });
      const materialText = activeStage.rewardMaterial
        ? `${MATERIAL_LABEL[activeStage.rewardMaterial.type]}+${activeStage.rewardMaterial.amount} ・ `
        : '';
      setResultText(
        `勝利! ${materialText}💰+${activeStage.rewardGold}${
          activeStage.rewardStones > 0 ? ` ・ 💎+${activeStage.rewardStones}` : ''
        }`
      );
    } else {
      setResultText('敗北…AP は消費されました。パーティやデッキを見直して再挑戦しましょう。');
    }
    setActiveStage(null);
  };

  if (activeStage) {
    const stageIndex =
      DUNGEON_STAGES.filter((s) => s.category === activeStage.category).findIndex((s) => s.id === activeStage.id) + 1;
    return (
      <BattleView
        stageLabel={`${DUNGEON_CATEGORY_LABEL[activeStage.category]} ${stageIndex}`}
        partyMembers={partyMembers}
        deckCardIds={profile.deckCardIds}
        enemyDefs={activeStage.enemyIds.map((id) => getEnemy(id))}
        onFinished={(r) => handleFinished(r.won)}
      />
    );
  }

  const stageList = (compact: boolean) => (
    <>
      {resultText && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>
      )}
      {categories.map((category) => (
        <View key={category} style={styles.categoryBlock}>
          <Text style={[styles.categoryTitle, compact && styles.categoryTitleCompact]}>
            {DUNGEON_CATEGORY_EMOJI[category]} {DUNGEON_CATEGORY_LABEL[category]}
          </Text>
          {DUNGEON_STAGES.filter((s) => s.category === category).map((stage) => (
            <Pressable
              key={stage.id}
              style={[styles.stageRow, compact && styles.stageRowCompact]}
              onPress={() => startStage(stage)}
            >
              <View style={styles.stageInfo}>
                <Text style={[styles.stageName, compact && styles.stageNameCompact]}>{stage.name}</Text>
                <Text style={[styles.stageReward, compact && styles.stageRewardCompact]}>
                  💰{stage.rewardGold}
                  {stage.rewardMaterial
                    ? ` ・ ${MATERIAL_EMOJI[stage.rewardMaterial.type]}${MATERIAL_LABEL[stage.rewardMaterial.type]}+${stage.rewardMaterial.amount}`
                    : ''}
                  {stage.rewardStones > 0 ? ` ・ 💎+${stage.rewardStones}` : ''}
                </Text>
              </View>
              <View style={styles.apCostBadge}>
                <Text style={styles.apCostText}>AP {stage.apCost}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </>
  );

  if (!background) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack}>
            <Text style={styles.backLink}>← 塔の中心へ戻る</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Bar value={ap.current} max={AP_MAX} color="#7c5cff" height={12} />
          <Text style={styles.apText}>
            AP {ap.current}/{AP_MAX} {ap.current < AP_MAX ? `(次の回復まで約${minutesLeft}分)` : ''}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.container}>{stageList(false)}</ScrollView>
      </SafeAreaView>
    );
  }

  // 背景付き: 塔内部のクリスタルパネル枠の中にステージ一覧を収める。
  const frame = background.panelFrame ?? DUNGEON_PANEL_FRAME_TRAINING;
  const panel = {
    left: imgSize.width * frame.left,
    top: imgSize.height * frame.top,
    width: imgSize.width * frame.width,
    height: imgSize.height * frame.height,
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground source={background.source} aspectRatio={background.aspectRatio} dim={0.08} />
      <SafeAreaView style={styles.safe} edges={['top']} pointerEvents="box-none">
        <View style={styles.compactHeader} pointerEvents="box-none">
          <Pressable onPress={onBack}>
            <Text style={styles.backLink}>← 塔の中心へ戻る</Text>
          </Pressable>
          <Text style={styles.compactTitle}>{title}</Text>
          <Bar value={ap.current} max={AP_MAX} color="#7c5cff" height={8} />
          <Text style={styles.apTextCompact}>
            AP {ap.current}/{AP_MAX}
          </Text>
        </View>
      </SafeAreaView>
      <View style={[styles.panelBox, { left: panel.left, top: panel.top, width: panel.width, height: panel.height }]}>
        <ScrollView contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false}>
          {stageList(true)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  apText: { color: '#9a9ab0', fontSize: 11, marginTop: 4, marginBottom: 4 },
  resultBox: { marginHorizontal: 16, backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 10, marginTop: 4 },
  resultText: { color: '#f5b400', fontSize: 12, fontWeight: '700' },
  container: { padding: 16, paddingBottom: 48 },
  categoryBlock: { marginBottom: 18 },
  categoryTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  categoryTitleCompact: { fontSize: 12, marginBottom: 6 },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  stageRowCompact: { padding: 8, marginBottom: 6, borderRadius: 8 },
  stageInfo: { flexShrink: 1 },
  stageName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stageNameCompact: { fontSize: 11 },
  stageReward: { color: '#9a9ab0', fontSize: 11, marginTop: 3 },
  stageRewardCompact: { fontSize: 9, marginTop: 2 },
  apCostBadge: { backgroundColor: '#7c5cff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  apCostText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  compactHeader: {
    paddingHorizontal: 14,
    paddingTop: 6,
    backgroundColor: 'rgba(10,6,24,0.55)',
  },
  compactTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  apTextCompact: { color: '#c4c4d4', fontSize: 10, marginTop: 3, marginBottom: 2 },
  panelBox: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
  },
  panelContent: { padding: 10, paddingBottom: 24 },
});
