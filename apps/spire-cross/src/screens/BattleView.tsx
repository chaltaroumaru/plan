import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { BattleCardInstance, BattlePartyState, CharacterDef, CharacterProgress, EnemyDef } from '../types';
import { getCard } from '../data/cards';
import { getCharacter } from '../data/characters';
import { createBattleState, endTurn, playCard, useUltimate } from '../game/battleEngine';
import Bar from '../components/Bar';
import CardView from '../components/CardView';

interface Props {
  partyMembers: { character: CharacterDef; progress: CharacterProgress }[];
  deckCardIds: string[];
  enemyDefs: EnemyDef[];
  onFinished: (result: { won: boolean }) => void;
}

const INTENT_LABEL: Record<string, string> = {
  attack: '⚔️ 攻撃',
  defend: '🛡️ 防御',
  buff: '💪 強化',
};

type PendingMode = 'none' | 'pick-actor' | 'pick-target' | 'pick-ultimate-target';

export default function BattleView({ partyMembers, deckCardIds, enemyDefs, onFinished }: Props) {
  const enemyDefMap = Object.fromEntries(enemyDefs.map((e) => [e.id, e]));
  const [state, setState] = useState<BattlePartyState>(() =>
    createBattleState(partyMembers, deckCardIds, enemyDefs)
  );
  const [pendingCard, setPendingCard] = useState<BattleCardInstance | null>(null);
  const [pendingActorUid, setPendingActorUid] = useState<string | null>(null);
  const [pendingUltimateActorUid, setPendingUltimateActorUid] = useState<string | null>(null);

  const mode: PendingMode = pendingUltimateActorUid
    ? 'pick-ultimate-target'
    : pendingCard && !pendingActorUid
      ? 'pick-actor'
      : pendingCard && pendingActorUid
        ? 'pick-target'
        : 'none';

  const resetPending = () => {
    setPendingCard(null);
    setPendingActorUid(null);
    setPendingUltimateActorUid(null);
  };

  const handleCardTap = (inst: BattleCardInstance) => {
    if (state.isOver) return;
    const card = getCard(inst.cardId);
    if (state.energy < card.cost) return;
    resetPending();
    setPendingCard(inst);
  };

  const handleActorTap = (uid: string) => {
    if (!pendingCard) return;
    const card = getCard(pendingCard.cardId);
    if (card.type === 'attack') {
      setPendingActorUid(uid);
    } else {
      setState((prev) => playCard(prev, pendingCard.uid, uid));
      resetPending();
    }
  };

  const handleEnemyTap = (enemyUid: string) => {
    if (pendingUltimateActorUid) {
      setState((prev) => useUltimate(prev, pendingUltimateActorUid, enemyUid));
      resetPending();
      return;
    }
    if (pendingCard && pendingActorUid) {
      setState((prev) => playCard(prev, pendingCard.uid, pendingActorUid, enemyUid));
      resetPending();
    }
  };

  const handleUltimateTap = (uid: string) => {
    resetPending();
    setPendingUltimateActorUid(uid);
  };

  const handleEndTurn = () => {
    resetPending();
    setState((prev) => endTurn(prev, enemyDefMap));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.enemyRow} horizontal showsHorizontalScrollIndicator={false}>
        {state.enemies.map((enemy, idx) => {
          const def = enemyDefMap[enemy.enemyId];
          const targetable = (mode === 'pick-target' || mode === 'pick-ultimate-target') && enemy.alive;
          return (
            <Pressable
              key={enemy.uid}
              testID={`enemy-slot-${idx}`}
              style={[styles.enemyBox, targetable && styles.targetable, !enemy.alive && styles.dead]}
              disabled={!targetable}
              onPress={() => handleEnemyTap(enemy.uid)}
            >
              <Text style={styles.enemyEmoji}>{def?.emoji ?? '👾'}</Text>
              <Text style={styles.enemyName} numberOfLines={1}>
                {def?.name ?? '敵'}
              </Text>
              <Bar value={enemy.hp} max={enemy.maxHp} color="#e8452f" height={10} />
              <Text style={styles.hpText}>
                {enemy.hp}/{enemy.maxHp} {enemy.block > 0 ? `🛡️${enemy.block}` : ''}
              </Text>
              {enemy.alive && (
                <Text style={styles.intentText}>
                  {INTENT_LABEL[enemy.intent.kind]}
                  {enemy.intent.kind === 'attack' ? ` ${enemy.intent.value}` : ''}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 8 }}>
        {state.log.slice(-6).map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>

      {mode !== 'none' && (
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>
            {mode === 'pick-actor' && 'このカードを使うキャラを選んでください'}
            {mode === 'pick-target' && '対象の敵を選んでください'}
            {mode === 'pick-ultimate-target' && '必殺技の対象を選んでください'}
          </Text>
          <Pressable onPress={resetPending}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.partyRow} horizontal showsHorizontalScrollIndicator={false}>
        {state.characters.map((c, idx) => {
          const def = getCharacter(c.characterId);
          const actorTappable = mode === 'pick-actor' && c.alive;
          return (
            <View
              key={c.uid}
              style={[styles.charBox, actorTappable && styles.targetable, !c.alive && styles.dead]}
            >
              <Pressable
                testID={`actor-slot-${idx}`}
                disabled={!actorTappable}
                onPress={() => handleActorTap(c.uid)}
              >
                <Text style={styles.charEmoji}>{def?.emoji ?? '🧑'}</Text>
                <Text style={styles.charName} numberOfLines={1}>
                  {def?.name ?? ''}
                </Text>
                <Bar value={c.hp} max={c.maxHp} color="#5fae6b" height={9} />
                <Text style={styles.hpText}>
                  {c.hp}/{c.maxHp} {c.block > 0 ? `🛡️${c.block}` : ''}
                </Text>
              </Pressable>
              {c.ultimateAvailable && (
                <Pressable
                  disabled={!c.ultimateReady || mode !== 'none'}
                  onPress={() => handleUltimateTap(c.uid)}
                  style={[styles.ultimateBadge, c.ultimateReady && styles.ultimateReady]}
                >
                  <Text style={styles.ultimateText}>
                    {c.ultimateReady ? '必殺技!' : `必殺${c.ultimateCooldownLeft}`}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Text style={styles.energyText}>
        ⚡ {state.energy}/{state.maxEnergy} ・ 山札{state.drawPile.length} ・ 捨札{state.discardPile.length} ・
        ターン{state.turn}
      </Text>

      <ScrollView horizontal contentContainerStyle={styles.hand} showsHorizontalScrollIndicator={false}>
        {state.hand.map((inst, idx) => {
          const card = getCard(inst.cardId);
          return (
            <CardView
              key={inst.uid}
              testID={`hand-card-${idx}`}
              card={card}
              disabled={state.energy < card.cost || state.isOver}
              selected={pendingCard?.uid === inst.uid}
              onPress={() => handleCardTap(inst)}
            />
          );
        })}
      </ScrollView>

      <Pressable style={styles.endTurnBtn} onPress={handleEndTurn} disabled={state.isOver}>
        <Text style={styles.endTurnText}>ターン終了</Text>
      </Pressable>

      {state.isOver && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>{state.didWin ? '🎉 勝利!' : '💀 敗北…'}</Text>
          <Pressable style={styles.overlayBtn} onPress={() => onFinished({ won: state.didWin })}>
            <Text style={styles.overlayBtnText}>続ける</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121a', padding: 10 },
  enemyRow: { paddingVertical: 4 },
  enemyBox: {
    width: 100,
    backgroundColor: '#1c1c26',
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  targetable: { borderColor: '#f5b400' },
  dead: { opacity: 0.25 },
  enemyEmoji: { fontSize: 30 },
  enemyName: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2 },
  hpText: { color: '#c4c4d4', fontSize: 10, marginTop: 2 },
  intentText: { color: '#f2d06b', fontSize: 10, fontWeight: '700', marginTop: 2 },
  logBox: { maxHeight: 60, backgroundColor: '#1c1c26', borderRadius: 8, marginVertical: 6 },
  logLine: { color: '#9a9ab0', fontSize: 11, marginBottom: 2 },
  promptBox: {
    backgroundColor: '#2a2a1a',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptText: { color: '#f5b400', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  cancelText: { color: '#e8452f', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  partyRow: { paddingVertical: 4 },
  charBox: {
    width: 96,
    backgroundColor: '#1c1c26',
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  charEmoji: { fontSize: 26, textAlign: 'center' },
  charName: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  ultimateBadge: {
    marginTop: 6,
    backgroundColor: '#33334a',
    borderRadius: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  ultimateReady: { backgroundColor: '#e8452f' },
  ultimateText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  energyText: { color: '#9a9ab0', fontSize: 11, textAlign: 'center', marginVertical: 4 },
  hand: { paddingVertical: 4, alignItems: 'flex-end' },
  endTurnBtn: { backgroundColor: '#3f8efc', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  endTurnText: { color: '#fff', fontWeight: '800' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,16,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 20 },
  overlayBtn: { backgroundColor: '#e8452f', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  overlayBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
