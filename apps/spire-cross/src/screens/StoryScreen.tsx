import React, { useState } from 'react';
import { Alert, ImageSourcePropType, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { STORY_CHAPTERS, STORY_STAGES, isStoryStageUnlocked } from '../data/storyStages';
import { getEnemy } from '../data/enemies';
import { getCharacter } from '../data/characters';
import { CharacterDef, CharacterProgress, StoryStageDef } from '../types';
import { grantExp } from '../game/leveling';
import BattleView from './BattleView';
import NarrativeReader from '../components/NarrativeReader';
import ScreenBackground, { DUNGEON_PANEL_FRAME_TRAINING, PanelFrame, useTopAlignedImageSize } from '../components/ScreenBackground';

type Phase = 'list' | 'intro' | 'battle' | 'outro';

/**
 * ストーリー進行(章一覧→本文を読む→戦闘→本文の続き)。下部タブの
 * 「ストーリー」からはそのまま(共通の塔背景)、ダンジョン画面の
 * 「ストーリーダンジョン」パネルからは専用背景+戻る導線付きで表示する。
 */
export default function StoryScreen({
  background,
  onBack,
}: {
  background?: { source: ImageSourcePropType; aspectRatio: number; panelFrame?: PanelFrame };
  onBack?: () => void;
} = {}) {
  const { profile, updateProfile } = useGame();
  const [phase, setPhase] = useState<Phase>('list');
  const [activeStage, setActiveStage] = useState<StoryStageDef | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const imgSize = useTopAlignedImageSize(background?.aspectRatio ?? 1);

  const partyMembers = profile.partyIds
    .map((id) => {
      const character = getCharacter(id);
      const progress = profile.characterProgress[id];
      return character && progress ? { character, progress } : null;
    })
    .filter((v): v is { character: CharacterDef; progress: CharacterProgress } => !!v);

  const startStage = (stage: StoryStageDef) => {
    if (partyMembers.length === 0) {
      Alert.alert('パーティが未編成です', 'キャラ画面でパーティを編成してください。');
      return;
    }
    setResultText(null);
    setActiveStage(stage);
    setPhase('intro');
  };

  const handleFinished = (won: boolean) => {
    if (!activeStage) return;
    if (won) {
      updateProfile((prev) => {
        const characterProgress = { ...prev.characterProgress };
        prev.partyIds.forEach((id) => {
          const progress = characterProgress[id];
          if (progress) {
            characterProgress[id] = grantExp(progress, activeStage.rewardExp);
          }
        });
        return {
          ...prev,
          gold: prev.gold + activeStage.rewardGold,
          stones: prev.stones + activeStage.rewardStones,
          characterProgress,
          clearedStoryStageIds: prev.clearedStoryStageIds.includes(activeStage.id)
            ? prev.clearedStoryStageIds
            : [...prev.clearedStoryStageIds, activeStage.id],
        };
      });
      setResultText(
        `クリア! 💰+${activeStage.rewardGold} ・ 💎+${activeStage.rewardStones} ・ EXP+${activeStage.rewardExp}(パーティ全員)`
      );
      setPhase('outro');
    } else {
      setResultText('敗北…パーティを強化してから再挑戦しましょう。');
      setActiveStage(null);
      setPhase('list');
    }
  };

  if (phase === 'intro' && activeStage) {
    return (
      <NarrativeReader
        chapterLabel={`第${activeStage.chapter}章「${activeStage.chapterTitle}」・${activeStage.order}`}
        title={activeStage.title}
        body={activeStage.narrativeIntro}
        continueLabel="戦闘へ進む →"
        onContinue={() => setPhase('battle')}
      />
    );
  }

  if (phase === 'battle' && activeStage) {
    return (
      <BattleView
        stageLabel={`第${activeStage.chapter}章-${activeStage.order}`}
        partyMembers={partyMembers}
        deckCardIds={profile.deckCardIds}
        enemyDefs={activeStage.enemyIds.map((id) => getEnemy(id))}
        onFinished={(r) => handleFinished(r.won)}
      />
    );
  }

  if (phase === 'outro' && activeStage) {
    return (
      <NarrativeReader
        chapterLabel={`第${activeStage.chapter}章「${activeStage.chapterTitle}」・${activeStage.order}`}
        title="そして、物語は続く"
        body={activeStage.narrativeOutro}
        continueLabel="続きへ ✓"
        onContinue={() => {
          setActiveStage(null);
          setPhase('list');
        }}
      />
    );
  }

  const chapterList = (compact: boolean) => (
    <>
      {resultText && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>
      )}
      {STORY_CHAPTERS.map(({ chapter, title: chapterTitle }) => {
        const chapterStages = STORY_STAGES.filter((s) => s.chapter === chapter).sort(
          (a, b) => a.order - b.order
        );
        return (
          <View key={chapter} style={styles.chapterBlock}>
            <Text style={[styles.chapterHeading, compact && styles.chapterHeadingCompact]}>
              第{chapter}章 「{chapterTitle}」
            </Text>
            {chapterStages.map((stage) => {
              const cleared = profile.clearedStoryStageIds.includes(stage.id);
              const unlocked = isStoryStageUnlocked(stage, profile.clearedStoryStageIds);
              return (
                <Pressable
                  key={stage.id}
                  style={[styles.stageCard, compact && styles.stageCardCompact, !unlocked && styles.locked]}
                  disabled={!unlocked}
                  onPress={() => startStage(stage)}
                >
                  <View style={styles.stageHeaderRow}>
                    <Text style={[styles.stageTitle, compact && styles.stageTitleCompact]}>
                      {stage.order}. {stage.title}
                    </Text>
                    {cleared && <Text style={styles.clearedBadge}>クリア済み</Text>}
                    {!unlocked && <Text style={styles.lockedBadge}>🔒</Text>}
                  </View>
                  <Text style={[styles.flavorText, compact && styles.flavorTextCompact]}>{stage.flavorText}</Text>
                  <Text style={[styles.rewardText, compact && styles.rewardTextCompact]}>
                    💰{stage.rewardGold} ・ 💎{stage.rewardStones} ・ EXP{stage.rewardExp}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </>
  );

  if (!background) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack}>
              <Text style={styles.backLink}>← 塔の中心へ戻る</Text>
            </Pressable>
          )}
          <Text style={styles.title}>ストーリー</Text>
          <Text style={styles.subtitle}>塔を昇る旅人の物語を、章ごとに読み進める</Text>
        </View>
        <ScrollView contentContainerStyle={styles.container}>{chapterList(false)}</ScrollView>
      </SafeAreaView>
    );
  }

  // 背景付き: 塔内部のクリスタルパネル枠の中に章一覧を収める。
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
          {onBack && (
            <Pressable onPress={onBack}>
              <Text style={styles.backLink}>← 塔の中心へ戻る</Text>
            </Pressable>
          )}
          <Text style={styles.compactTitle}>ストーリー</Text>
        </View>
      </SafeAreaView>
      <View style={[styles.panelBox, { left: panel.left, top: panel.top, width: panel.width, height: panel.height }]}>
        <ScrollView contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false}>
          {chapterList(true)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#9a9ab0', fontSize: 12, marginTop: 4, marginBottom: 4 },
  resultBox: { marginHorizontal: 16, backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 10, marginTop: 4 },
  resultText: { color: '#f5b400', fontSize: 12, fontWeight: '700' },
  container: { padding: 16, paddingBottom: 48 },
  chapterBlock: { marginBottom: 20 },
  chapterHeading: {
    color: '#c9b8ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  chapterHeadingCompact: { fontSize: 11, marginBottom: 6 },
  stageCard: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 10 },
  stageCardCompact: { padding: 9, borderRadius: 9, marginBottom: 6 },
  locked: { opacity: 0.4 },
  stageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stageTitleCompact: { fontSize: 11 },
  clearedBadge: { color: '#5fae6b', fontSize: 11, fontWeight: '700' },
  lockedBadge: { fontSize: 14 },
  flavorText: { color: '#c4c4d4', fontSize: 12, marginTop: 6, lineHeight: 18 },
  flavorTextCompact: { fontSize: 10, marginTop: 4, lineHeight: 14 },
  rewardText: { color: '#9a9ab0', fontSize: 11, marginTop: 8 },
  rewardTextCompact: { fontSize: 9, marginTop: 4 },
  compactHeader: {
    paddingHorizontal: 14,
    paddingTop: 6,
    backgroundColor: 'rgba(10,6,24,0.55)',
  },
  compactTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2, marginBottom: 6 },
  panelBox: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
  },
  panelContent: { padding: 10, paddingBottom: 24 },
});
