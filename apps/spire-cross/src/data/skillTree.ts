import { Rarity, SkillTreeNodeDef } from '../types';

/** スキルツリーの効果量に掛けるレアリティ倍率(カード・キャラの基礎ステ倍率と同じ考え方) */
export const SKILL_RARITY_MULT: Record<Rarity, number> = {
  N: 1.0,
  R: 1.15,
  SR: 1.35,
  SSR: 1.6,
};

/**
 * 全キャラ共通のスキルツリー構成(テンプレート)。
 * 効果量は SKILL_RARITY_MULT でキャラのレアリティに応じてスケールする。
 * 実際の効果量は src/game/skillTree.ts の getSkillTreeForCharacter で計算する。
 */
export const SKILL_TREE_TEMPLATE: SkillTreeNodeDef[] = [
  {
    id: 'hp1',
    label: 'HP強化I',
    description: '最大HPを増やす。',
    cost: 1,
    effect: { kind: 'hp', amount: 8 },
    requiresNodeIds: [],
  },
  {
    id: 'hp2',
    label: 'HP強化II',
    description: '最大HPをさらに増やす。',
    cost: 1,
    effect: { kind: 'hp', amount: 12 },
    requiresNodeIds: ['hp1'],
  },
  {
    id: 'atk1',
    label: '攻撃力強化I',
    description: '攻撃力を増やす。',
    cost: 1,
    effect: { kind: 'atk', amount: 3 },
    requiresNodeIds: [],
  },
  {
    id: 'atk2',
    label: '攻撃力強化II',
    description: '攻撃力をさらに増やす。',
    cost: 1,
    effect: { kind: 'atk', amount: 4 },
    requiresNodeIds: ['atk1'],
  },
  {
    id: 'def1',
    label: '防御力強化I',
    description: '防御力を増やす。',
    cost: 1,
    effect: { kind: 'def', amount: 2 },
    requiresNodeIds: [],
  },
  {
    id: 'def2',
    label: '防御力強化II',
    description: '防御力をさらに増やす。',
    cost: 1,
    effect: { kind: 'def', amount: 3 },
    requiresNodeIds: ['def1'],
  },
  {
    id: 'crit',
    label: 'クリティカルの心得',
    description: 'クリティカル率を上げる。',
    cost: 2,
    effect: { kind: 'critRate', amount: 5 },
    requiresNodeIds: ['atk2'],
  },
  {
    id: 'cutrate',
    label: '受け流しの構え',
    description: '被ダメージカット率を上げる。',
    cost: 2,
    effect: { kind: 'critCutRate', amount: 5 },
    requiresNodeIds: ['def2'],
  },
  {
    id: 'ult_cooldown',
    label: '闘気の高まり',
    description: '必殺技ゲージが貯まるまでのターン数を短縮する。',
    cost: 2,
    effect: { kind: 'ultimateCooldown', amount: 1 },
    requiresNodeIds: ['hp2'],
  },
  {
    id: 'special_card_gate',
    label: '固有奥義の開眼',
    description:
      '専用カードを所持していると解放できる特殊ノード。属性が一致するカードの効果を強化する。',
    cost: 3,
    effect: { kind: 'elementMatchBonus', amount: 10 },
    requiresNodeIds: ['crit', 'cutrate'],
    requiresSignatureCard: true,
    requiresMaterial: { type: 'unlock', amount: 12 },
  },
  {
    id: 'ultimate_unlock',
    label: '必殺技解放',
    description: 'このキャラの必殺技をバトルで使用可能にする。',
    cost: 4,
    effect: { kind: 'ultimateUnlock' },
    requiresNodeIds: ['ult_cooldown', 'special_card_gate'],
    requiresTotalSpent: 6,
  },
];

export const SKILL_TREE_MAP: Record<string, SkillTreeNodeDef> = Object.fromEntries(
  SKILL_TREE_TEMPLATE.map((n) => [n.id, n])
);

export function getSkillTreeNode(id: string): SkillTreeNodeDef {
  const node = SKILL_TREE_MAP[id];
  if (!node) throw new Error(`Unknown skill tree node id: ${id}`);
  return node;
}

export const TOTAL_SKILL_TREE_COST = SKILL_TREE_TEMPLATE.reduce((sum, n) => sum + n.cost, 0);
