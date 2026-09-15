import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { CharacterDef } from '../types';
import { useGame } from '../state/GameContext';
import { RARITY_COLOR } from '../data/characters';
import { SKILL_TREE_TEMPLATE } from '../data/skillTree';
import { MATERIAL_LABEL } from '../data/economy';
import { getCard } from '../data/cards';
import { computeEffectiveStats, canAllocateNode, allocateNode } from '../game/skillTree';
import { expForNextLevel } from '../game/leveling';
import Bar from '../components/Bar';

export default function CharacterDetailView({
  character,
  onBack,
}: {
  character: CharacterDef;
  onBack: () => void;
}) {
  const { profile, updateProfile } = useGame();
  const progress = profile.characterProgress[character.id];

  if (!progress) {
    return null;
  }

  const stats = computeEffectiveStats(character, progress);
  const signatureCard = getCard(character.signatureCardId);
  const ownsSignatureCard = (profile.ownedCardCounts[character.signatureCardId] ?? 0) > 0;

  const handleAllocate = (nodeId: string) => {
    const check = canAllocateNode(nodeId, character, progress, profile);
    if (!check.ok) {
      Alert.alert('解放できません', check.reason ?? '');
      return;
    }
    updateProfile((prev) => allocateNode(prev, character, prev.characterProgress[character.id], nodeId));
  };

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← キャラ一覧に戻る</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{character.emoji}</Text>
        <View style={{ flex: 1 }}>
          <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[character.rarity] }]}>
            <Text style={styles.rarityText}>{character.rarity}</Text>
          </View>
          <Text style={styles.name}>{character.name}</Text>
          <Text style={styles.title}>
            {character.title} ・ {character.element}属性
          </Text>
        </View>
      </View>

      <View style={styles.levelBox}>
        <Text style={styles.levelText}>
          Lv.{progress.level} ・ EXP {progress.exp}/{expForNextLevel(progress.level)} ・ スキルポイント{' '}
          {progress.skillPoints}
        </Text>
        <Bar value={progress.exp} max={expForNextLevel(progress.level)} color="#f5b400" height={8} />
      </View>

      <View style={styles.statsBox}>
        <Text style={styles.statLine}>HP {stats.maxHp}</Text>
        <Text style={styles.statLine}>攻撃力 {stats.atk}</Text>
        <Text style={styles.statLine}>防御力 {stats.def}</Text>
        <Text style={styles.statLine}>クリティカル率 {stats.critRate}%</Text>
        <Text style={styles.statLine}>被ダメカット率 {stats.critCutRate}%</Text>
        <Text style={styles.statLine}>属性一致ボーナス +{stats.elementMatchBonus}%</Text>
        <Text style={styles.statLine}>
          必殺技 {stats.ultimateUnlocked ? `解放済み(${stats.ultimateMaxCooldown}ターンで発動)` : '未解放'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>専用カード</Text>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureText}>
          {signatureCard.name}({signatureCard.description}) を{ownsSignatureCard ? '所持しています' : '所持していません'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>スキルツリー</Text>
      {SKILL_TREE_TEMPLATE.map((node) => {
        const allocated = progress.allocatedNodeIds.includes(node.id);
        const check = canAllocateNode(node.id, character, progress, profile);
        return (
          <View key={node.id} style={[styles.nodeBox, allocated && styles.nodeAllocated]}>
            <View style={styles.nodeHeaderRow}>
              <Text style={styles.nodeLabel}>
                {allocated ? '✅ ' : ''}
                {node.label}
              </Text>
              <Text style={styles.nodeCost}>{node.cost}pt</Text>
            </View>
            <Text style={styles.nodeDesc}>{node.description}</Text>
            {node.requiresSignatureCard && (
              <Text style={styles.nodeReq}>条件: 専用カード所持</Text>
            )}
            {node.requiresMaterial && (
              <Text style={styles.nodeReq}>
                条件: {MATERIAL_LABEL[node.requiresMaterial.type]}
                {node.requiresMaterial.amount}(所持
                {profile.materials[node.requiresMaterial.type] ?? 0})
              </Text>
            )}
            {node.requiresTotalSpent && (
              <Text style={styles.nodeReq}>条件: 累計{node.requiresTotalSpent}pt消費</Text>
            )}
            {!allocated && (
              <Pressable
                style={[styles.allocateBtn, !check.ok && styles.allocateBtnDisabled]}
                disabled={!check.ok}
                onPress={() => handleAllocate(node.id)}
              >
                <Text style={styles.allocateBtnText}>{check.ok ? '解放する' : check.reason}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#3f8efc', fontSize: 13, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 48, marginRight: 12 },
  rarityBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  title: { color: '#9a9ab0', fontSize: 12, marginTop: 2 },
  levelBox: { backgroundColor: '#1c1c26', borderRadius: 10, padding: 10, marginBottom: 12 },
  levelText: { color: '#fff', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  statsBox: { backgroundColor: '#1c1c26', borderRadius: 10, padding: 12, marginBottom: 16 },
  statLine: { color: '#c4c4d4', fontSize: 13, marginBottom: 4 },
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 8, marginTop: 4 },
  signatureBox: { backgroundColor: '#1c1c26', borderRadius: 10, padding: 12, marginBottom: 16 },
  signatureText: { color: '#c4c4d4', fontSize: 12 },
  nodeBox: {
    backgroundColor: '#1c1c26',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  nodeAllocated: { borderColor: '#5fae6b' },
  nodeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  nodeLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nodeCost: { color: '#f5b400', fontWeight: '800', fontSize: 12 },
  nodeDesc: { color: '#c4c4d4', fontSize: 11, marginTop: 4 },
  nodeReq: { color: '#9a9ab0', fontSize: 10, marginTop: 4 },
  allocateBtn: { backgroundColor: '#3f8efc', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  allocateBtnDisabled: { backgroundColor: '#2a2a35' },
  allocateBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
