import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { CharacterDef, SkillTreeNodeDef } from '../types';

const CANVAS_W = 340;
const CANVAS_H = 330;

interface NodeLayout {
  id: string;
  x: number;
  y: number;
  radius: number;
  tier: 'small' | 'large' | 'keystone';
  emoji: string;
}

const NODE_LAYOUT: NodeLayout[] = [
  { id: 'hp1', x: 127, y: 230, radius: 13, tier: 'small', emoji: '💗' },
  { id: 'hp2', x: 97, y: 216, radius: 13, tier: 'small', emoji: '💗' },
  { id: 'ult_cooldown', x: 62, y: 200, radius: 19, tier: 'large', emoji: '⏱️' },
  { id: 'atk1', x: 213, y: 230, radius: 13, tier: 'small', emoji: '⚔️' },
  { id: 'atk2', x: 243, y: 216, radius: 13, tier: 'small', emoji: '⚔️' },
  { id: 'crit', x: 278, y: 200, radius: 19, tier: 'large', emoji: '🎯' },
  { id: 'def1', x: 170, y: 203, radius: 13, tier: 'small', emoji: '🛡️' },
  { id: 'def2', x: 170, y: 169, radius: 13, tier: 'small', emoji: '🛡️' },
  { id: 'cutrate', x: 170, y: 131, radius: 19, tier: 'large', emoji: '🌀' },
  { id: 'special_card_gate', x: 252, y: 121, radius: 22, tier: 'large', emoji: '🃏' },
  { id: 'ultimate_unlock', x: 119, y: 74, radius: 25, tier: 'keystone', emoji: '✨' },
];

const CENTER = { x: 170, y: 250, radius: 30 };

const NODE_LAYOUT_MAP: Record<string, NodeLayout> = Object.fromEntries(
  NODE_LAYOUT.map((n) => [n.id, n])
);

const TIER_COLOR = {
  locked: { fill: 'rgba(60,52,90,0.85)', border: '#4a4460' },
  allocatable: { fill: 'rgba(124,92,255,0.35)', border: '#c9b8ff' },
  allocated: { fill: '#f5b400', border: '#ffe9a8' },
  selected: { border: '#ffffff' },
};

export default function SkillTreeRadial({
  character,
  nodes,
  allocatedNodeIds,
  allocatableNodeIds,
  selectedNodeId,
  onSelectNode,
}: {
  character: CharacterDef;
  nodes: SkillTreeNodeDef[];
  allocatedNodeIds: string[];
  allocatableNodeIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const edges: { fromId: string | null; from: { x: number; y: number }; toId: string; to: { x: number; y: number } }[] = [];
  nodes.forEach((node) => {
    const to = NODE_LAYOUT_MAP[node.id];
    if (!to) return;
    if (node.requiresNodeIds.length === 0) {
      edges.push({ fromId: null, from: CENTER, toId: node.id, to });
    } else {
      node.requiresNodeIds.forEach((reqId) => {
        const from = NODE_LAYOUT_MAP[reqId];
        if (from) edges.push({ fromId: reqId, from, toId: node.id, to });
      });
    }
  });

  return (
    <View style={styles.canvas}>
      <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill}>
        {edges.map((e, i) => {
          const bothAllocated =
            allocatedNodeIds.includes(e.toId) && (e.fromId === null || allocatedNodeIds.includes(e.fromId));
          return (
            <Line
              key={i}
              x1={e.from.x}
              y1={e.from.y}
              x2={e.to.x}
              y2={e.to.y}
              stroke={bothAllocated ? '#f5b400' : 'rgba(124,92,255,0.35)'}
              strokeWidth={bothAllocated ? 3 : 2}
            />
          );
        })}
      </Svg>

      {/* 中央: キャラクター */}
      <View
        style={[
          styles.charNode,
          { left: CENTER.x - CENTER.radius, top: CENTER.y - CENTER.radius, width: CENTER.radius * 2, height: CENTER.radius * 2 },
        ]}
      >
        <Text style={styles.charEmoji}>{character.emoji}</Text>
      </View>
      <Text style={[styles.charLabel, { left: CENTER.x - 60, top: CENTER.y + CENTER.radius + 4, width: 120 }]} numberOfLines={1}>
        {character.name}
      </Text>

      {NODE_LAYOUT.map((n) => {
        const allocated = allocatedNodeIds.includes(n.id);
        const allocatable = allocatableNodeIds.includes(n.id);
        const selected = selectedNodeId === n.id;
        const colors = allocated ? TIER_COLOR.allocated : allocatable ? TIER_COLOR.allocatable : TIER_COLOR.locked;
        return (
          <Pressable
            key={n.id}
            onPress={() => onSelectNode(n.id)}
            style={[
              styles.node,
              {
                left: n.x - n.radius,
                top: n.y - n.radius,
                width: n.radius * 2,
                height: n.radius * 2,
                borderRadius: n.radius,
                backgroundColor: colors.fill,
                borderColor: selected ? TIER_COLOR.selected.border : colors.border,
                borderWidth: selected ? 3 : n.tier === 'small' ? 1.5 : 2,
              },
            ]}
          >
            <Text style={{ fontSize: n.tier === 'small' ? 10 : n.tier === 'large' ? 13 : 16 }}>{n.emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: CANVAS_W, height: CANVAS_H, alignSelf: 'center' },
  charNode: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,255,0.25)',
    borderWidth: 2,
    borderColor: '#c9b8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charEmoji: { fontSize: 26 },
  charLabel: {
    position: 'absolute',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
