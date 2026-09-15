import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import { CharacterDef } from '../types';
import { useGame } from '../state/GameContext';
import { SKILL_TREE_TEMPLATE, getSkillTreeNode } from '../data/skillTree';
import { MATERIAL_LABEL } from '../data/economy';
import { computeEffectiveStats, canAllocateNode, allocateNode } from '../game/skillTree';
import SkillTreeRadial from './SkillTreeRadial';

/**
 * キャラ1体分のステータス表示+放射状スキルツリー+ノード詳細パネル。
 * CharacterDetailView(一覧からの詳細)とSkillTreeHubView(ハブから直接)の両方から使う共通部品。
 */
export default function SkillTreePanel({ character }: { character: CharacterDef }) {
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
    <View>
      <View style={styles.statsBox}>
        <Text style={styles.statLine}>スキルポイント {progress.skillPoints}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  statsBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 12, marginBottom: 12 },
  statLine: { color: '#c4c4d4', fontSize: 13, marginBottom: 4 },
  helpText: { color: '#9a90b8', fontSize: 11, marginBottom: 8 },
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
