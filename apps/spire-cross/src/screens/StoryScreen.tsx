import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { STORY_STAGES, isStoryStageUnlocked } from '../data/storyStages';
import { getEnemy } from '../data/enemies';
import { getCharacter } from '../data/characters';
import { CharacterDef, CharacterProgress, StoryStageDef } from '../types';
import { grantExp } from '../game/leveling';
import BattleView from './BattleView';

export default function StoryScreen() {
  const { profile, updateProfile } = useGame();
  const [activeStage, setActiveStage] = useState<StoryStageDef | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

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
    } else {
      setResultText('敗北…パーティを強化してから再挑戦しましょう。');
    }
    setActiveStage(null);
  };

  if (activeStage) {
    return (
      <BattleView
        partyMembers={partyMembers}
        deckCardIds={profile.deckCardIds}
        enemyDefs={activeStage.enemyIds.map((id) => getEnemy(id))}
        onFinished={(r) => handleFinished(r.won)}
      />
    );
  }

  const chapterStages = STORY_STAGES.filter((s) => s.chapter === 1).sort((a, b) => a.order - b.order);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>ストーリー</Text>
        <Text style={styles.subtitle}>第1章</Text>
      </View>

      {resultText && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {chapterStages.map((stage) => {
          const cleared = profile.clearedStoryStageIds.includes(stage.id);
          const unlocked = isStoryStageUnlocked(stage, profile.clearedStoryStageIds);
          return (
            <Pressable
              key={stage.id}
              style={[styles.stageCard, !unlocked && styles.locked]}
              disabled={!unlocked}
              onPress={() => startStage(stage)}
            >
              <View style={styles.stageHeaderRow}>
                <Text style={styles.stageTitle}>
                  {stage.order}. {stage.title}
                </Text>
                {cleared && <Text style={styles.clearedBadge}>クリア済み</Text>}
                {!unlocked && <Text style={styles.lockedBadge}>🔒</Text>}
              </View>
              <Text style={styles.flavorText}>{stage.flavorText}</Text>
              <Text style={styles.rewardText}>
                💰{stage.rewardGold} ・ 💎{stage.rewardStones} ・ EXP{stage.rewardExp}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#9a9ab0', fontSize: 12, marginTop: 4, marginBottom: 4 },
  resultBox: { marginHorizontal: 16, backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 10, marginTop: 4 },
  resultText: { color: '#f5b400', fontSize: 12, fontWeight: '700' },
  container: { padding: 16, paddingBottom: 48 },
  stageCard: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 10 },
  locked: { opacity: 0.4 },
  stageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  clearedBadge: { color: '#5fae6b', fontSize: 11, fontWeight: '700' },
  lockedBadge: { fontSize: 14 },
  flavorText: { color: '#c4c4d4', fontSize: 12, marginTop: 6, lineHeight: 18 },
  rewardText: { color: '#9a9ab0', fontSize: 11, marginTop: 8 },
});
