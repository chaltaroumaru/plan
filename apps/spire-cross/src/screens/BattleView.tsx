import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { BattleState, EnemyDef } from '../types';
import { getCard } from '../data/cards';
import { createBattleState, endTurn, playCard } from '../game/battleEngine';
import Bar from '../components/Bar';
import CardView from '../components/CardView';

interface Props {
  enemy: EnemyDef;
  deck: string[];
  playerHp: number;
  playerMaxHp: number;
  strength: number;
  onFinished: (result: { won: boolean; hp: number; strength: number }) => void;
}

const INTENT_LABEL: Record<string, string> = {
  attack: '⚔️ 攻撃',
  defend: '🛡️ 防御',
  buff: '💪 強化',
};

export default function BattleView({ enemy, deck, playerHp, playerMaxHp, strength, onFinished }: Props) {
  const [state, setState] = useState<BattleState>(() =>
    createBattleState(enemy, deck, playerHp, playerMaxHp, strength)
  );

  const handlePlay = (uid: string) => {
    setState((prev) => playCard(prev, uid, enemy.name));
  };

  const handleEndTurn = () => {
    setState((prev) => endTurn(prev, enemy));
  };

  return (
    <View style={styles.container}>
      <View style={styles.enemyBox}>
        <Text style={styles.enemyEmoji}>{enemy.emoji}</Text>
        <Text style={styles.enemyName}>
          {enemy.name} {enemy.isElite ? '(エリート)' : enemy.isBoss ? '(ボス)' : ''}
        </Text>
        <Bar value={state.enemyHp} max={state.enemyMaxHp} color="#e8452f" height={16} />
        <Text style={styles.hpText}>
          HP {state.enemyHp}/{state.enemyMaxHp} {state.enemyBlock > 0 ? `🛡️${state.enemyBlock}` : ''}
        </Text>
        <View style={styles.intentBox}>
          <Text style={styles.intentText}>
            次の行動: {INTENT_LABEL[state.enemyIntent.kind]}
            {state.enemyIntent.kind === 'attack' ? ` ${state.enemyIntent.value}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 8 }}>
        {state.log.slice(-6).map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.playerBox}>
        <View style={styles.playerStatsRow}>
          <Text style={styles.playerStat}>
            ❤️ {state.playerHp}/{state.playerMaxHp}
          </Text>
          <Text style={styles.playerStat}>🛡️ {state.playerBlock}</Text>
          <Text style={styles.playerStat}>💪 {state.strength}</Text>
          <Text style={styles.playerStat}>
            ⚡ {state.energy}/{state.maxEnergy}
          </Text>
        </View>
        <Bar value={state.playerHp} max={state.playerMaxHp} color="#5fae6b" height={14} />
        <Text style={styles.pileText}>
          山札 {state.drawPile.length} ・ 捨札 {state.discardPile.length} ・ ターン {state.turn}
        </Text>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.hand} showsHorizontalScrollIndicator={false}>
        {state.hand.map((inst) => {
          const card = getCard(inst.cardId);
          return (
            <CardView
              key={inst.uid}
              card={card}
              disabled={state.energy < card.cost || state.isOver}
              onPress={() => handlePlay(inst.uid)}
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
          <Pressable
            style={styles.overlayBtn}
            onPress={() => onFinished({ won: state.didWin, hp: state.playerHp, strength: state.strength })}
          >
            <Text style={styles.overlayBtnText}>続ける</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121a', padding: 12 },
  enemyBox: { alignItems: 'center', marginBottom: 8 },
  enemyEmoji: { fontSize: 44 },
  enemyName: { color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 2 },
  hpText: { color: '#c4c4d4', fontSize: 12, marginTop: 2 },
  intentBox: { backgroundColor: '#20202c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  intentText: { color: '#f2d06b', fontSize: 12, fontWeight: '700' },
  logBox: { maxHeight: 76, backgroundColor: '#1c1c26', borderRadius: 8, marginBottom: 8 },
  logLine: { color: '#9a9ab0', fontSize: 11, marginBottom: 2 },
  playerBox: { marginBottom: 4 },
  playerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  playerStat: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pileText: { color: '#9a9ab0', fontSize: 11, marginTop: 4 },
  hand: { paddingVertical: 8, alignItems: 'flex-end' },
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
