import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { CharacterDef } from '../types';
import { useGame } from '../state/GameContext';
import { RARITY_COLOR } from '../data/characters';
import { SKILL_TREE_TEMPLATE, getSkillTreeNode } from '../data/skillTree';
import { MATERIAL_LABEL } from '../data/economy';
import { getCard } from '../data/cards';
import { computeEffectiveStats, canAllocateNode, allocateNode } from '../game/skillTree';
import { expForNextLevel } from '../game/leveling';
import Bar from '../components/Bar';
import SkillTreeRadial from '../components/SkillTreeRadial';

export default function CharacterDetailView({
  character,
  onBack,
}: {
  character: CharacterDef;
  onBack: () => void;
}) {
  const { profile, updateProfile } = useGame();
  const progress = profile.characterProgress[character.id];
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const allocatableNodeIds = useMemo(() => {
    if (!progress) return [];
    return SKILL_TREE_TEMPLATE.filter((node) => {
      if (progress.allocatedNodeIds.includes(node.id)) return false;
      if (node.requiresNodeIds.some((id) => !progress.allocatedNodeIds.includes(id))) return false;
      if (node.requiresSignatureCard && (profile.ownedCardCounts[character.signatureCardId] ?? 0) <= 0) {
        return false;
      }
      if (
        node.requiresMaterial &&
        (profile.materials[node.requiresMaterial.type] ?? 0) < node.requiresMaterial.amount
      ) {
        return false;
      }
      if (node.requiresTotalSpent) {
        const spent = progress.allocatedNodeIds.reduce((sum, id) => sum + getSkillTreeNode(id).cost, 0);
        if (spent < node.requiresTotalSpent) return false;
      }
      return true;
    }).map((n) => n.id);
  }, [progress, profile, character.signatureCardId]);

  if (!progress) {
    return null;
  }

  const stats = computeEffectiveStats(character, progress);
  const signatureCard = getCard(character.signatureCardId);
  const ownsSignatureCard = (profile.ownedCardCounts[character.signatureCardId] ?? 0) > 0;
  const selectedNode = selectedNodeId ? getSkillTreeNode(selectedNodeId) : null;
  const selectedAllocated = selectedNodeId ? progress.allocatedNodeIds.includes(selectedNodeId) : false;
  const selectedCheck = selectedNodeId ? canAllocateNode(selectedNodeId, character, progress, profile) : null;

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
      <Text style={styles.helpText}>
        小さいノード=基礎ステータス、大きいノード=特殊効果・必殺技。タップすると詳細が下に表示されます。
      </Text>

      <SkillTreeRadial
        character={character}
        nodes={SKILL_TREE_TEMPLATE}
        allocatedNodeIds={progress.allocatedNodeIds}
        allocatableNodeIds={allocatableNodeIds}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />

      {selectedNode && (
        <View style={[styles.nodeDetailBox, selectedAllocated && styles.nodeDetailAllocated]}>
          <View style={styles.nodeHeaderRow}>
            <Text style={styles.nodeLabel}>
              {selectedAllocated ? '✅ ' : ''}
              {selectedNode.label}
            </Text>
            <Text style={styles.nodeCost}>{selectedNode.cost}pt</Text>
          </View>
          <Text style={styles.nodeDesc}>{selectedNode.description}</Text>
          {selectedNode.requiresSignatureCard && <Text style={styles.nodeReq}>条件: 専用カード所持</Text>}
          {selectedNode.requiresMaterial && (
            <Text style={styles.nodeReq}>
              条件: {MATERIAL_LABEL[selectedNode.requiresMaterial.type]}
              {selectedNode.requiresMaterial.amount}(所持
              {profile.materials[selectedNode.requiresMaterial.type] ?? 0})
            </Text>
          )}
          {selectedNode.requiresTotalSpent && (
            <Text style={styles.nodeReq}>条件: 累計{selectedNode.requiresTotalSpent}pt消費</Text>
          )}
          {!selectedAllocated && selectedCheck && (
            <Pressable
              style={[styles.allocateBtn, !selectedCheck.ok && styles.allocateBtnDisabled]}
              disabled={!selectedCheck.ok}
              onPress={() => handleAllocate(selectedNode.id)}
            >
              <Text style={styles.allocateBtnText}>{selectedCheck.ok ? '解放する' : selectedCheck.reason}</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 48, marginRight: 12 },
  rarityBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  title: { color: '#9a9ab0', fontSize: 12, marginTop: 2 },
  levelBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 10, marginBottom: 12 },
  levelText: { color: '#fff', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  statsBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 12, marginBottom: 16 },
  statLine: { color: '#c4c4d4', fontSize: 13, marginBottom: 4 },
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 8, marginTop: 4 },
  helpText: { color: '#9a90b8', fontSize: 11, marginBottom: 8 },
  signatureBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 12, marginBottom: 16 },
  signatureText: { color: '#c4c4d4', fontSize: 12 },
  nodeDetailBox: {
    backgroundColor: 'rgba(30,20,58,0.9)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)',
  },
  nodeDetailAllocated: { borderColor: '#5fae6b' },
  nodeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  nodeLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nodeCost: { color: '#f5b400', fontWeight: '800', fontSize: 12 },
  nodeDesc: { color: '#c4c4d4', fontSize: 11, marginTop: 4 },
  nodeReq: { color: '#9a9ab0', fontSize: 10, marginTop: 4 },
  allocateBtn: { backgroundColor: '#7c5cff', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  allocateBtnDisabled: { backgroundColor: 'rgba(124,92,255,0.28)' },
  allocateBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
