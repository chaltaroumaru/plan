import { SKILL_RARITY_MULT, SKILL_TREE_TEMPLATE, getSkillTreeNode } from '../data/skillTree';
import { CharacterDef, CharacterProgress, PlayerProfile } from '../types';

export interface EffectiveStats {
  maxHp: number;
  atk: number;
  def: number;
  critRate: number;
  critCutRate: number;
  elementMatchBonus: number;
  ultimateMaxCooldown: number;
  ultimateUnlocked: boolean;
}

const BASE_ULTIMATE_COOLDOWN = 4;
const MIN_ULTIMATE_COOLDOWN = 2;

export function computeEffectiveStats(
  character: CharacterDef,
  progress: CharacterProgress
): EffectiveStats {
  const mult = SKILL_RARITY_MULT[character.rarity];
  let maxHp = character.baseHp;
  let atk = character.baseAtk;
  let def = character.baseDef;
  let critRate = 0;
  let critCutRate = 0;
  let elementMatchBonus = 0;
  let cooldownReduction = 0;
  let ultimateUnlocked = false;

  progress.allocatedNodeIds.forEach((nodeId) => {
    const node = getSkillTreeNode(nodeId);
    switch (node.effect.kind) {
      case 'hp':
        maxHp += Math.round(node.effect.amount * mult);
        break;
      case 'atk':
        atk += Math.round(node.effect.amount * mult);
        break;
      case 'def':
        def += Math.round(node.effect.amount * mult);
        break;
      case 'critRate':
        critRate += node.effect.amount;
        break;
      case 'critCutRate':
        critCutRate += node.effect.amount;
        break;
      case 'elementMatchBonus':
        elementMatchBonus += node.effect.amount;
        break;
      case 'ultimateCooldown':
        cooldownReduction += node.effect.amount;
        break;
      case 'ultimateUnlock':
        ultimateUnlocked = true;
        break;
    }
  });

  return {
    maxHp,
    atk,
    def,
    critRate,
    critCutRate,
    elementMatchBonus,
    ultimateMaxCooldown: Math.max(MIN_ULTIMATE_COOLDOWN, BASE_ULTIMATE_COOLDOWN - cooldownReduction),
    ultimateUnlocked,
  };
}

export interface AllocateCheck {
  ok: boolean;
  reason?: string;
}

export function canAllocateNode(
  nodeId: string,
  character: CharacterDef,
  progress: CharacterProgress,
  profile: PlayerProfile
): AllocateCheck {
  const node = getSkillTreeNode(nodeId);
  if (progress.allocatedNodeIds.includes(nodeId)) {
    return { ok: false, reason: 'すでに解放済みです' };
  }
  if (progress.skillPoints < node.cost) {
    return { ok: false, reason: `スキルポイントが足りません(必要:${node.cost})` };
  }
  const missingPrereq = node.requiresNodeIds.some((id) => !progress.allocatedNodeIds.includes(id));
  if (missingPrereq) {
    return { ok: false, reason: '前提ノードが未解放です' };
  }
  if (node.requiresSignatureCard) {
    const owned = profile.ownedCardCounts[character.signatureCardId] ?? 0;
    if (owned <= 0) {
      return { ok: false, reason: '専用カードを所持していません' };
    }
  }
  if (node.requiresMaterial) {
    const have = profile.materials[node.requiresMaterial.type] ?? 0;
    if (have < node.requiresMaterial.amount) {
      return { ok: false, reason: '素材が足りません' };
    }
  }
  if (node.requiresTotalSpent) {
    const spent = progress.allocatedNodeIds.reduce((sum, id) => sum + getSkillTreeNode(id).cost, 0);
    if (spent < node.requiresTotalSpent) {
      return { ok: false, reason: `累計消費ポイントが足りません(必要:${node.requiresTotalSpent})` };
    }
  }
  return { ok: true };
}

export function allocateNode(
  profile: PlayerProfile,
  character: CharacterDef,
  progress: CharacterProgress,
  nodeId: string
): PlayerProfile {
  const check = canAllocateNode(nodeId, character, progress, profile);
  if (!check.ok) {
    throw new Error(check.reason ?? '解放条件を満たしていません');
  }
  const node = getSkillTreeNode(nodeId);
  const nextProgress: CharacterProgress = {
    ...progress,
    skillPoints: progress.skillPoints - node.cost,
    allocatedNodeIds: [...progress.allocatedNodeIds, nodeId],
  };
  const nextMaterials = { ...profile.materials };
  if (node.requiresMaterial) {
    nextMaterials[node.requiresMaterial.type] -= node.requiresMaterial.amount;
  }
  return {
    ...profile,
    materials: nextMaterials,
    characterProgress: {
      ...profile.characterProgress,
      [character.id]: nextProgress,
    },
  };
}

export const TOTAL_SKILL_NODES = SKILL_TREE_TEMPLATE.length;
