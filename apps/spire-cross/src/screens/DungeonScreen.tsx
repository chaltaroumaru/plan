import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
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

const CATEGORIES: DungeonCategory[] = ['enhance', 'evolve', 'unlock', 'memory', 'raid', 'event'];

export default function DungeonScreen() {
  const { profile, updateProfile } = useGame();
  const [activeStage, setActiveStage] = useState<DungeonStageDef | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const ap = useMemo(() => recoverAp(profile.ap), [profile.ap]);
  const minutesLeft = useMemo(() => minutesUntilNextAp(profile.ap), [profile.ap]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>ダンジョン</Text>
        <Bar value={ap.current} max={AP_MAX} color="#7c5cff" height={12} />
        <Text style={styles.apText}>
          AP {ap.current}/{AP_MAX} {ap.current < AP_MAX ? `(次の回復まで約${minutesLeft}分)` : ''}
        </Text>
      </View>

      {resultText && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {CATEGORIES.map((category) => (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>
              {DUNGEON_CATEGORY_EMOJI[category]} {DUNGEON_CATEGORY_LABEL[category]}
            </Text>
            {DUNGEON_STAGES.filter((s) => s.category === category).map((stage) => (
              <Pressable key={stage.id} style={styles.stageRow} onPress={() => startStage(stage)}>
                <View style={styles.stageInfo}>
                  <Text style={styles.stageName}>{stage.name}</Text>
                  <Text style={styles.stageReward}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  apText: { color: '#9a9ab0', fontSize: 11, marginTop: 4, marginBottom: 4 },
  resultBox: { marginHorizontal: 16, backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 10, marginTop: 4 },
  resultText: { color: '#f5b400', fontSize: 12, fontWeight: '700' },
  container: { padding: 16, paddingBottom: 48 },
  categoryBlock: { marginBottom: 18 },
  categoryTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  stageInfo: { flexShrink: 1 },
  stageName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stageReward: { color: '#9a9ab0', fontSize: 11, marginTop: 3 },
  apCostBadge: { backgroundColor: '#7c5cff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  apCostText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
