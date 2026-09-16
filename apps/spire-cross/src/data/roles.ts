import { Element, PlayerRole, SkillTreeNodeDef } from '../types';

export const PLAYER_ROLES: PlayerRole[] = ['pierce', 'guard', 'weave', 'shadow'];

/** 境界に対してどう関わる存在か、という一本の軸で統一した役職名。 */
export const ROLE_LABEL: Record<PlayerRole, string> = {
  pierce: '穿界',
  guard: '防人',
  weave: '結晶術師',
  shadow: '疾影',
};

export const ROLE_READING: Record<PlayerRole, string> = {
  pierce: 'せんかい',
  guard: 'さきもり',
  weave: 'けっしょうじゅつし',
  shadow: 'しつえい',
};

export const ROLE_TITLE: Record<PlayerRole, string> = {
  pierce: '境界を穿つ者',
  guard: '境界を守る者',
  weave: '交界石を紡ぐ者',
  shadow: '境界を潜る影',
};

export const ROLE_DESCRIPTION: Record<PlayerRole, string> = {
  pierce: '高い攻撃力で敵を切り崩す前衛。攻めに特化する分、防御は薄い。',
  guard: '高いHP・防御力で仲間を守る壁役。攻撃力は控えめ。',
  weave: '交界石(想いの結晶)の力を操り、属性の噛み合いを深める術者。',
  shadow: 'クリティカルで一撃を狙う搦め手。素早いが打たれ弱い。',
};

export const ROLE_EMOJI: Record<PlayerRole, string> = {
  pierce: '⚔️',
  guard: '🛡️',
  weave: '💎',
  shadow: '🗡️',
};

export const ROLE_COLOR: Record<PlayerRole, string> = {
  pierce: '#e2725b',
  guard: '#7a8fae',
  weave: '#b164e8',
  shadow: '#4a3466',
};

export const ROLE_ELEMENT: Record<PlayerRole, Element> = {
  pierce: '火',
  guard: '土',
  weave: '光',
  shadow: '闇',
};

/** 役職ごとの素点への上乗せ(ポイント振り分け後、最後に加算する固定の得手・不得手) */
export const ROLE_STAT_MODIFIER: Record<PlayerRole, { hp: number; atk: number; def: number }> = {
  pierce: { hp: 0, atk: 3, def: -1 },
  guard: { hp: 8, atk: -2, def: 3 },
  weave: { hp: -2, atk: 1, def: 0 },
  shadow: { hp: -3, atk: 2, def: 0 },
};

const roleNode = (
  role: PlayerRole,
  id: string,
  label: string,
  description: string,
  cost: number,
  effect: SkillTreeNodeDef['effect'],
  requiresNodeIds: string[] = [],
  requiresTotalSpent?: number
): SkillTreeNodeDef => ({
  id: `${role}_${id}`,
  label,
  description,
  cost,
  effect,
  requiresNodeIds: requiresNodeIds.map((r) => `${role}_${r}`),
  ...(requiresTotalSpent ? { requiresTotalSpent } : {}),
});

/** 穿界(アタッカー): 攻撃力とクリティカルを伸ばす直線的なツリー */
const PIERCE_TREE: SkillTreeNodeDef[] = [
  roleNode('pierce', 'atk1', '刃の理I', '攻撃力を増やす。', 1, { kind: 'atk', amount: 4 }),
  roleNode('pierce', 'atk2', '刃の理II', '攻撃力をさらに増やす。', 1, { kind: 'atk', amount: 5 }, ['atk1']),
  roleNode('pierce', 'crit1', '穿つ一撃I', 'クリティカル率を上げる。', 2, { kind: 'critRate', amount: 6 }, ['atk2']),
  roleNode('pierce', 'hp1', '境界耐性', '最大HPを増やす。', 1, { kind: 'hp', amount: 6 }),
  roleNode('pierce', 'atk3', '刃の理III', '攻撃力をさらに増やす。', 2, { kind: 'atk', amount: 6 }, ['crit1']),
  roleNode('pierce', 'crit2', '穿つ一撃II', 'クリティカル率をさらに上げる。', 2, { kind: 'critRate', amount: 6 }, ['atk3']),
  roleNode('pierce', 'ult_cd', '闘気の疾走', '必殺技ゲージが貯まるまでのターン数を短縮する。', 2, { kind: 'ultimateCooldown', amount: 1 }, ['hp1']),
  roleNode('pierce', 'ultimate', '滅びを穿つ', '必殺技をバトルで使用可能にする。', 4, { kind: 'ultimateUnlock' }, ['crit2', 'ult_cd'], 8),
];

/** 防人(ブロッカー): HP・防御・被ダメカットを伸ばす */
const GUARD_TREE: SkillTreeNodeDef[] = [
  roleNode('guard', 'hp1', '結界の理I', '最大HPを増やす。', 1, { kind: 'hp', amount: 10 }),
  roleNode('guard', 'def1', '守りの理I', '防御力を増やす。', 1, { kind: 'def', amount: 4 }),
  roleNode('guard', 'hp2', '結界の理II', '最大HPをさらに増やす。', 1, { kind: 'hp', amount: 10 }, ['hp1']),
  roleNode('guard', 'def2', '守りの理II', '防御力をさらに増やす。', 1, { kind: 'def', amount: 4 }, ['def1']),
  roleNode('guard', 'cut1', '受け流しI', '被ダメージカット率を上げる。', 2, { kind: 'critCutRate', amount: 8 }, ['hp2']),
  roleNode('guard', 'cut2', '受け流しII', '被ダメージカット率をさらに上げる。', 2, { kind: 'critCutRate', amount: 8 }, ['def2']),
  roleNode('guard', 'ult_cd', '不動の意志', '必殺技ゲージが貯まるまでのターン数を短縮する。', 2, { kind: 'ultimateCooldown', amount: 1 }, ['cut1']),
  roleNode('guard', 'ultimate', '境界の防壁', '必殺技をバトルで使用可能にする。', 4, { kind: 'ultimateUnlock' }, ['cut2', 'ult_cd'], 8),
];

/** 結晶術師(魔術師): 交界石の力=属性一致ボーナスを軸にしたツリー */
const WEAVE_TREE: SkillTreeNodeDef[] = [
  roleNode('weave', 'atk1', '紡ぐ理I', '攻撃力を増やす。', 1, { kind: 'atk', amount: 3 }),
  roleNode('weave', 'hp1', '結晶の加護', '最大HPを増やす。', 1, { kind: 'hp', amount: 6 }),
  roleNode('weave', 'elem1', '共鳴律I', '属性一致ボーナスを上げる。', 2, { kind: 'elementMatchBonus', amount: 8 }, ['atk1']),
  roleNode('weave', 'elem2', '共鳴律II', '属性一致ボーナスをさらに上げる。', 2, { kind: 'elementMatchBonus', amount: 8 }, ['elem1']),
  roleNode('weave', 'crit1', '想いの一閃', 'クリティカル率を上げる。', 2, { kind: 'critRate', amount: 4 }, ['hp1']),
  roleNode('weave', 'ult_cd1', '詠唱の加速I', '必殺技ゲージが貯まるまでのターン数を短縮する。', 2, { kind: 'ultimateCooldown', amount: 1 }, ['elem2']),
  roleNode('weave', 'ult_cd2', '詠唱の加速II', '必殺技ゲージが貯まるまでのターン数をさらに短縮する。', 2, { kind: 'ultimateCooldown', amount: 1 }, ['crit1']),
  roleNode('weave', 'ultimate', '交界の秘術', '必殺技をバトルで使用可能にする。', 4, { kind: 'ultimateUnlock' }, ['ult_cd1', 'ult_cd2'], 8),
];

/** 疾影(アサシン): クリティカルと速さに特化したツリー */
const SHADOW_TREE: SkillTreeNodeDef[] = [
  roleNode('shadow', 'atk1', '刻む刃I', '攻撃力を増やす。', 1, { kind: 'atk', amount: 4 }),
  roleNode('shadow', 'crit1', '見切りI', 'クリティカル率を上げる。', 2, { kind: 'critRate', amount: 7 }, ['atk1']),
  roleNode('shadow', 'atk2', '刻む刃II', '攻撃力をさらに増やす。', 1, { kind: 'atk', amount: 4 }, ['crit1']),
  roleNode('shadow', 'crit2', '見切りII', 'クリティカル率をさらに上げる。', 2, { kind: 'critRate', amount: 7 }, ['atk2']),
  roleNode('shadow', 'hp1', '残響の靭さ', '最大HPを増やす。', 1, { kind: 'hp', amount: 5 }),
  roleNode('shadow', 'ult_cd1', '疾さの理I', '必殺技ゲージが貯まるまでのターン数を短縮する。', 2, { kind: 'ultimateCooldown', amount: 1 }, ['crit2']),
  roleNode('shadow', 'ult_cd2', '疾さの理II', '必殺技ゲージが貯まるまでのターン数をさらに短縮する。', 2, { kind: 'ultimateCooldown', amount: 1 }, ['hp1']),
  roleNode('shadow', 'ultimate', '影断ち', '必殺技をバトルで使用可能にする。', 4, { kind: 'ultimateUnlock' }, ['ult_cd1', 'ult_cd2'], 8),
];

export const ROLE_SKILL_TREE: Record<PlayerRole, SkillTreeNodeDef[]> = {
  pierce: PIERCE_TREE,
  guard: GUARD_TREE,
  weave: WEAVE_TREE,
  shadow: SHADOW_TREE,
};

export const ALL_ROLE_SKILL_NODES: SkillTreeNodeDef[] = PLAYER_ROLES.flatMap((r) => ROLE_SKILL_TREE[r]);
