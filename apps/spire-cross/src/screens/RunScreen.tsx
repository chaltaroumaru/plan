import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { CardDef, NodeType, RunNode } from '../types';
import { getAvailableNodes } from '../game/mapGenerator';
import { getEnemy } from '../data/enemies';
import { goldRewardFor, gemRewardFor, pickCardRewards } from '../game/rewards';
import BattleView from './BattleView';
import CardView from '../components/CardView';
import Bar from '../components/Bar';

type Mode = 'map' | 'battle' | 'reward' | 'rest' | 'shop' | 'event' | 'result';

const NODE_ICON: Record<NodeType, string> = {
  battle: '⚔️',
  elite: '💀',
  rest: '🔥',
  shop: '🏪',
  event: '❓',
  boss: '🐲',
};

const NODE_LABEL: Record<NodeType, string> = {
  battle: '戦闘',
  elite: 'エリート',
  rest: '休憩',
  shop: 'ショップ',
  event: 'イベント',
  boss: 'ボス',
};

const SHOP_HEAL_COST = 40;
const TOTAL_FLOORS = 7;

export default function RunScreen({ navigation }: any) {
  const { run, profile, updateRun, updateProfile, setRun } = useGame();
  const [mode, setMode] = useState<Mode>('map');
  const [activeNode, setActiveNode] = useState<RunNode | null>(null);
  const [reward, setReward] = useState<{
    gold: number;
    gems: number;
    cards: CardDef[];
  } | null>(null);
  const [eventText, setEventText] = useState<string | null>(null);
  const [eventResolved, setEventResolved] = useState(false);
  const [resultWon, setResultWon] = useState(false);

  const availableIds = useMemo(() => {
    if (!run) return new Set<string>();
    return new Set(getAvailableNodes(run.nodes, run.currentNodeId).map((n) => n.id));
  }, [run]);

  if (!run) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>冒険が始まっていません</Text>
          <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('ホーム')}>
            <Text style={styles.emptyBtnText}>ホームでパーティを編成する</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const advanceToNode = (nodeId: string, extra?: { hp?: number; maxHp?: number }) => {
    updateRun((prev) => {
      if (!prev) return prev;
      const nodes = prev.nodes.map((n) => (n.id === nodeId ? { ...n, visited: true } : n));
      return {
        ...prev,
        nodes,
        currentNodeId: nodeId,
        hp: extra?.hp ?? prev.hp,
        maxHp: extra?.maxHp ?? prev.maxHp,
      };
    });
    const node = run.nodes.find((n) => n.id === nodeId);
    if (node) {
      updateProfile((prev) => ({
        ...prev,
        bestFloorCleared: Math.max(prev.bestFloorCleared, node.floor + 1),
      }));
    }
    setActiveNode(null);
    setMode('map');
  };

  const handleNodePress = (node: RunNode) => {
    if (!availableIds.has(node.id)) return;
    setActiveNode(node);
    if (node.type === 'rest') setMode('rest');
    else if (node.type === 'shop') setMode('shop');
    else if (node.type === 'event') {
      const texts = [
        '古い祠を見つけた。手を合わせると力が湧いてくる…',
        '旅の商人に出会い、ちょっとした助言をもらった。',
        '廃墟で光る何かを見つけた。',
      ];
      setEventText(texts[Math.floor(Math.random() * texts.length)]);
      setEventResolved(false);
      setMode('event');
    } else {
      setMode('battle');
    }
  };

  const handleBattleFinished = (result: { won: boolean; hp: number; strength: number }) => {
    if (!activeNode) return;
    if (!result.won) {
      setResultWon(false);
      setMode('result');
      return;
    }

    updateRun((prev) => (prev ? { ...prev, hp: result.hp, strength: result.strength } : prev));

    if (activeNode.type === 'boss') {
      const gems = gemRewardFor('boss');
      updateProfile((prev) => ({
        ...prev,
        gems: prev.gems + gems,
        bestFloorCleared: Math.max(prev.bestFloorCleared, TOTAL_FLOORS),
      }));
      setRun(null);
      setResultWon(true);
      setMode('result');
      return;
    }

    const isElite = activeNode.type === 'elite';
    const gold = goldRewardFor(isElite ? 'elite' : 'battle');
    const gems = isElite ? gemRewardFor('elite') : 0;
    updateProfile((prev) => ({ ...prev, gold: prev.gold + gold, gems: prev.gems + gems }));
    const cards = pickCardRewards(run.partyIds, 3);
    setReward({ gold, gems, cards });
    setMode('reward');
  };

  const finishReward = (chosenCard?: CardDef) => {
    if (!activeNode) return;
    if (chosenCard) {
      updateRun((prev) => (prev ? { ...prev, deck: [...prev.deck, chosenCard.id] } : prev));
    }
    setReward(null);
    advanceToNode(activeNode.id);
  };

  const handleRest = () => {
    if (!activeNode) return;
    const healAmount = Math.round(run.maxHp * 0.3);
    const hp = Math.min(run.maxHp, run.hp + healAmount);
    advanceToNode(activeNode.id, { hp });
  };

  const handleShopHeal = () => {
    if (profile.gold < SHOP_HEAL_COST) {
      Alert.alert('ゴールドが足りません', `${SHOP_HEAL_COST}ゴールド必要です。`);
      return;
    }
    updateProfile((prev) => ({ ...prev, gold: prev.gold - SHOP_HEAL_COST }));
    updateRun((prev) => (prev ? { ...prev, hp: prev.maxHp } : prev));
  };

  const handleEventResolve = () => {
    if (!activeNode) return;
    const gainGold = Math.random() < 0.5;
    if (gainGold) {
      const amount = 15 + Math.floor(Math.random() * 15);
      updateProfile((prev) => ({ ...prev, gold: prev.gold + amount }));
      setEventText((prev) => `${prev}\n\n${amount}ゴールドを手に入れた!`);
    } else {
      updateRun((prev) => (prev ? { ...prev, maxHp: prev.maxHp + 5, hp: prev.hp + 5 } : prev));
      setEventText((prev) => `${prev}\n\n最大HPが5上昇した!`);
    }
    setEventResolved(true);
  };

  const backToHome = () => navigation.navigate('ホーム');

  if (mode === 'battle' && activeNode?.enemyId) {
    const enemy = getEnemy(activeNode.enemyId);
    return (
      <BattleView
        enemy={enemy}
        deck={run.deck}
        playerHp={run.hp}
        playerMaxHp={run.maxHp}
        strength={run.strength}
        onFinished={handleBattleFinished}
      />
    );
  }

  if (mode === 'reward' && reward) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>戦闘報酬</Text>
          <Text style={styles.rewardLine}>💰 ゴールド +{reward.gold}</Text>
          {reward.gems > 0 && <Text style={styles.rewardLine}>💎 ジェム +{reward.gems}</Text>}
          <Text style={styles.sectionTitle}>カードを1枚選んでデッキに加える</Text>
          <View style={styles.cardRow}>
            {reward.cards.map((c, idx) => (
              <CardView key={`${c.id}_${idx}`} card={c} onPress={() => finishReward(c)} />
            ))}
          </View>
          <Pressable style={styles.skipBtn} onPress={() => finishReward()}>
            <Text style={styles.skipBtnText}>スキップして先へ進む</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'rest' && activeNode) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerBox}>
          <Text style={styles.nodeEmojiBig}>🔥</Text>
          <Text style={styles.title}>焚き火</Text>
          <Text style={styles.desc}>体力の30%を回復できる。</Text>
          <Bar value={run.hp} max={run.maxHp} color="#5fae6b" />
          <Text style={styles.desc}>HP {run.hp}/{run.maxHp}</Text>
          <Pressable style={styles.actionBtn} onPress={handleRest}>
            <Text style={styles.actionBtnText}>休憩する (+{Math.round(run.maxHp * 0.3)} HP)</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'shop' && activeNode) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerBox}>
          <Text style={styles.nodeEmojiBig}>🏪</Text>
          <Text style={styles.title}>行商人</Text>
          <Text style={styles.desc}>所持ゴールド: {profile.gold}</Text>
          <Pressable style={styles.actionBtn} onPress={handleShopHeal}>
            <Text style={styles.actionBtnText}>全回復する (💰{SHOP_HEAL_COST})</Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={() => advanceToNode(activeNode.id)}>
            <Text style={styles.skipBtnText}>何も買わずに進む</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'event' && activeNode) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerBox}>
          <Text style={styles.nodeEmojiBig}>❓</Text>
          <Text style={styles.title}>不思議な出来事</Text>
          <Text style={styles.desc}>{eventText}</Text>
          {!eventResolved ? (
            <Pressable style={styles.actionBtn} onPress={handleEventResolve}>
              <Text style={styles.actionBtnText}>調べてみる</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.actionBtn} onPress={() => advanceToNode(activeNode.id)}>
              <Text style={styles.actionBtnText}>先へ進む</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'result') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerBox}>
          <Text style={styles.nodeEmojiBig}>{resultWon ? '🏆' : '💀'}</Text>
          <Text style={styles.title}>{resultWon ? '冒険をクリアした!' : '冒険は失敗に終わった…'}</Text>
          <Text style={styles.desc}>
            {resultWon ? 'ジェムを手に入れた。またパーティを編成して挑戦しよう。' : 'デッキはリセットされる。またホームから挑戦しよう。'}
          </Text>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              if (!resultWon) setRun(null);
              backToHome();
            }}
          >
            <Text style={styles.actionBtnText}>ホームに戻る</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // map view
  const floors = Array.from(new Set(run.nodes.map((n) => n.floor))).sort((a, b) => b - a);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.mapHeader}>
        <Bar value={run.hp} max={run.maxHp} color="#5fae6b" />
        <Text style={styles.mapHeaderText}>
          HP {run.hp}/{run.maxHp} ・ 💪{run.strength} ・ 💰{profile.gold}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {floors.map((floor) => (
          <View key={floor} style={styles.floorRow}>
            {run.nodes
              .filter((n) => n.floor === floor)
              .map((node) => {
                const available = availableIds.has(node.id);
                const isCurrent = run.currentNodeId === node.id;
                return (
                  <Pressable
                    key={node.id}
                    disabled={!available}
                    onPress={() => handleNodePress(node)}
                    style={[
                      styles.node,
                      node.visited && styles.nodeVisited,
                      available && styles.nodeAvailable,
                      isCurrent && styles.nodeCurrent,
                    ]}
                  >
                    <Text style={styles.nodeIcon}>{NODE_ICON[node.type]}</Text>
                    <Text style={styles.nodeLabel}>{NODE_LABEL[node.type]}</Text>
                  </Pressable>
                );
              })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#fff', fontSize: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#3f8efc', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  mapHeader: { paddingHorizontal: 16, paddingTop: 8 },
  mapHeaderText: { color: '#9a9ab0', fontSize: 12, marginTop: 4, marginBottom: 8 },
  floorRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  node: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1c1c26',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  nodeVisited: { opacity: 0.6, backgroundColor: '#25252f' },
  nodeAvailable: { opacity: 1, backgroundColor: '#2a2a3d', borderWidth: 2, borderColor: '#3f8efc' },
  nodeCurrent: { borderColor: '#f5b400' },
  nodeIcon: { fontSize: 24 },
  nodeLabel: { color: '#fff', fontSize: 10, marginTop: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 12, textAlign: 'center' },
  desc: { color: '#c4c4d4', fontSize: 13, marginTop: 8, textAlign: 'center' },
  sectionTitle: { color: '#fff', fontWeight: '700', marginTop: 20, marginBottom: 4 },
  rewardLine: { color: '#f5b400', fontSize: 16, fontWeight: '700', marginTop: 4 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap' },
  skipBtn: { marginTop: 16, backgroundColor: '#2a2a35', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  skipBtnText: { color: '#c4c4d4', fontWeight: '700' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  nodeEmojiBig: { fontSize: 56 },
  actionBtn: { marginTop: 20, backgroundColor: '#3f8efc', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14 },
  actionBtnText: { color: '#fff', fontWeight: '800' },
});
