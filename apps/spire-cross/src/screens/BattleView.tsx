import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, Pressable, Switch } from 'react-native';
import { BattleCardInstance, BattlePartyState, CharacterDef, CharacterProgress, EnemyDef } from '../types';
import { getCard } from '../data/cards';
import { getCharacter } from '../data/characters';
import { createBattleState, endTurn, playCard, useUltimate, HAND_SIZE } from '../game/battleEngine';
import { useGame } from '../state/GameContext';
import Bar from '../components/Bar';
import CardView from '../components/CardView';

interface Props {
  stageLabel: string;
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

export default function BattleView({ stageLabel, partyMembers, deckCardIds, enemyDefs, onFinished }: Props) {
  const { profile, updateProfile } = useGame();
  const enemyDefMap = Object.fromEntries(enemyDefs.map((e) => [e.id, e]));
  const [state, setState] = useState<BattlePartyState>(() =>
    createBattleState(partyMembers, deckCardIds, enemyDefs)
  );
  const [pendingCard, setPendingCard] = useState<BattleCardInstance | null>(null);
  const [pendingActorUid, setPendingActorUid] = useState<string | null>(null);
  const [pendingUltimateActorUid, setPendingUltimateActorUid] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bottomRowWidth, setBottomRowWidth] = useState(0);

  const PILE_WIDTH = 34;
  const ROW_GAP = 6;
  const slotCount = Math.max(state.hand.length, HAND_SIZE);
  const cardSlotWidth =
    bottomRowWidth > 0
      ? Math.max(Math.floor((bottomRowWidth - PILE_WIDTH * 2 - ROW_GAP * 2) / slotCount) - 4, 44)
      : 64;
  const cardSlotHeight = Math.max(Math.floor(cardSlotWidth * 1.35), 70);

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
      <View style={styles.topBar}>
        <View style={styles.topBarSide}>
          <Text style={styles.stageLabelText}>{stageLabel}</Text>
        </View>
        <View style={styles.topBarCenter}>
          <Text style={styles.turnLabelText}>ターン {state.turn}</Text>
        </View>
        <View style={[styles.topBarSide, styles.topBarSideRight]}>
          <Pressable testID="battle-settings-btn" style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>
      </View>

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
                {c.awakened && (
                  <View style={styles.awakenedBadge}>
                    <Text style={styles.awakenedBadgeText}>覚醒</Text>
                  </View>
                )}
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
        ⚡ {state.energy}/{state.maxEnergy}
      </Text>

      <View style={styles.bottomRow} onLayout={(e) => setBottomRowWidth(e.nativeEvent.layout.width)}>
        <View style={styles.pileBadge}>
          <Text style={styles.pileIcon}>🂠</Text>
          <Text style={styles.pileCount}>{state.drawPile.length}</Text>
        </View>

        <View style={styles.hand}>
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
                style={{
                  width: cardSlotWidth,
                  minHeight: cardSlotHeight,
                  padding: cardSlotWidth < 80 ? 5 : 8,
                  marginHorizontal: 2,
                }}
              />
            );
          })}
        </View>

        <View style={styles.pileBadge}>
          <Text style={styles.pileIcon}>🗑️</Text>
          <Text style={styles.pileCount}>{state.discardPile.length}</Text>
        </View>
      </View>

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

      <Modal visible={settingsOpen} animationType="fade" transparent onRequestClose={() => setSettingsOpen(false)}>
        <Pressable style={styles.settingsOverlay} onPress={() => setSettingsOpen(false)}>
          <Pressable style={styles.settingsSheet} onPress={() => {}}>
            <Text style={styles.settingsTitle}>バトル設定</Text>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>効果音(SE)</Text>
              <Switch
                value={profile.settings.seOn}
                onValueChange={(v) => updateProfile((prev) => ({ ...prev, settings: { ...prev.settings, seOn: v } }))}
                trackColor={{ false: '#3a3350', true: '#7c5cff' }}
                thumbColor="#fff"
              />
            </View>
            <Pressable style={styles.settingsCloseBtn} onPress={() => setSettingsOpen(false)}>
              <Text style={styles.settingsCloseText}>閉じる</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  topBarSide: { flex: 1, alignItems: 'flex-start' },
  topBarSideRight: { alignItems: 'flex-end' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  stageLabelText: { color: '#c9b8ff', fontSize: 13, fontWeight: '800' },
  turnLabelText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30,20,58,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 16 },
  enemyRow: { paddingVertical: 4, flexGrow: 1, minWidth: '100%', justifyContent: 'center' },
  enemyBox: {
    width: 100,
    backgroundColor: 'rgba(30,20,58,0.78)',
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
  logBox: { maxHeight: 60, backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 8, marginVertical: 6 },
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
  partyRow: { paddingVertical: 4, flexGrow: 1, minWidth: '100%', justifyContent: 'center' },
  charBox: {
    width: 96,
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  awakenedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f5b400',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 1,
  },
  awakenedBadgeText: { color: '#1a1330', fontSize: 9, fontWeight: '800' },
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
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end' },
  hand: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  pileBadge: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  pileIcon: { fontSize: 14 },
  pileCount: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 2 },
  endTurnBtn: { backgroundColor: '#7c5cff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
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
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  settingsSheet: { width: '80%', backgroundColor: '#150f2e', borderRadius: 16, padding: 18 },
  settingsTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingsLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  settingsCloseBtn: { backgroundColor: '#7c5cff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  settingsCloseText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
