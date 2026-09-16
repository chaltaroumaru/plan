import { CharacterDef, Rarity } from '../types';

export const RARITY_ORDER: Rarity[] = ['N', 'R', 'SR', 'SSR'];

export const RARITY_COLOR: Record<Rarity, string> = {
  N: '#8a8f98',
  R: '#4fa3e3',
  SR: '#b164e8',
  SSR: '#f5b400',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
};

/** レアリティごとの基礎ステータス基準値(キャラ間の差は今後のバランス調整で付ける想定) */
export const BASE_STATS_BY_RARITY: Record<Rarity, { hp: number; atk: number; def: number }> = {
  N: { hp: 40, atk: 8, def: 4 },
  R: { hp: 55, atk: 11, def: 6 },
  SR: { hp: 75, atk: 15, def: 9 },
  SSR: { hp: 100, atk: 20, def: 13 },
};

type CharacterSeed = Omit<CharacterDef, 'baseHp' | 'baseAtk' | 'baseDef' | 'signatureCardId'> & {
  cardIds: [string, string];
};

const CHARACTER_SEEDS: CharacterSeed[] = [
  {
    id: 'apprentice_warrior',
    name: '見習い戦士',
    title: '駆け出しの剣',
    rarity: 'N',
    element: '火',
    color: '#e2725b',
    emoji: '🗡️',
    cardIds: ['apprentice_warrior_atk', 'apprentice_warrior_skl'],
  },
  {
    id: 'forest_archer',
    name: '森の弓兵',
    title: '風読みの矢',
    rarity: 'N',
    element: '風',
    color: '#5fae6b',
    emoji: '🏹',
    cardIds: ['forest_archer_atk', 'forest_archer_skl'],
  },
  {
    id: 'village_healer',
    name: '村の治療師',
    title: '灯火の祈り',
    rarity: 'N',
    element: '光',
    color: '#f2d06b',
    emoji: '💊',
    cardIds: ['village_healer_atk', 'village_healer_skl'],
  },
  {
    id: 'shield_recruit',
    name: '盾持ちの新兵',
    title: '土の守り',
    rarity: 'N',
    element: '土',
    color: '#a68a64',
    emoji: '🛡️',
    cardIds: ['shield_recruit_atk', 'shield_recruit_skl'],
  },
  {
    id: 'lightning_swordsman',
    name: '稲妻の剣士',
    title: '雷鳴一閃',
    rarity: 'R',
    element: '雷',
    color: '#e8c93f',
    emoji: '⚡',
    cardIds: ['lightning_swordsman_atk', 'lightning_swordsman_skl'],
  },
  {
    id: 'frost_mage',
    name: '氷結の魔術師',
    title: '静寂の氷',
    rarity: 'R',
    element: '水',
    color: '#5bc0e8',
    emoji: '❄️',
    cardIds: ['frost_mage_atk', 'frost_mage_skl'],
  },
  {
    id: 'shadow_rogue',
    name: '影渡りの盗賊',
    title: '闇に潜む刃',
    rarity: 'R',
    element: '闇',
    color: '#6a5b8a',
    emoji: '🗡️',
    cardIds: ['shadow_rogue_atk', 'shadow_rogue_skl'],
  },
  {
    id: 'paladin_trainee',
    name: '聖騎士見習い',
    title: '誓いの盾',
    rarity: 'R',
    element: '光',
    color: '#f2e6a0',
    emoji: '⚔️',
    cardIds: ['paladin_trainee_atk', 'paladin_trainee_skl'],
  },
  {
    id: 'crimson_blade_saint',
    name: '紅蓮の剣聖',
    title: '業火を纏う剣',
    rarity: 'SR',
    element: '火',
    color: '#e8452f',
    emoji: '🔥',
    cardIds: ['crimson_blade_saint_atk', 'crimson_blade_saint_pow'],
  },
  {
    id: 'abyss_witch',
    name: '深淵の魔女',
    title: '深き闇の詠唱',
    rarity: 'SR',
    element: '闇',
    color: '#4a3466',
    emoji: '🔮',
    cardIds: ['abyss_witch_atk', 'abyss_witch_pow'],
  },
  {
    id: 'sky_hunter',
    name: '天空の狩人',
    title: '疾風迅雷',
    rarity: 'SR',
    element: '風',
    color: '#4fb0a5',
    emoji: '🦅',
    cardIds: ['sky_hunter_atk', 'sky_hunter_pow'],
  },
  {
    id: 'star_guiding_goddess',
    name: '星導の女神',
    title: '導きの光輝',
    rarity: 'SSR',
    element: '光',
    color: '#ffd76a',
    emoji: '✨',
    cardIds: ['star_guiding_goddess_atk', 'star_guiding_goddess_pow'],
  },
  {
    id: 'doom_dragoon',
    name: '終焉の竜騎士',
    title: '滅びを穿つ槍',
    rarity: 'SSR',
    element: '闇',
    color: '#7a1f3d',
    emoji: '🐉',
    cardIds: ['doom_dragoon_atk', 'doom_dragoon_pow'],
  },
];

export const CHARACTERS: CharacterDef[] = CHARACTER_SEEDS.map((seed) => {
  const base = BASE_STATS_BY_RARITY[seed.rarity];
  return {
    ...seed,
    baseHp: base.hp,
    baseAtk: base.atk,
    baseDef: base.def,
    signatureCardId: seed.cardIds[0],
  };
});

export const CHARACTER_MAP: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c])
);

// 旅人(プレイヤーが作成する主人公)は固定データではなく、プレイヤーの
// ポイント振り分け・役職選択から動的に組み立てられる(game/travelerBuild.ts)。
// GameProvider が profile.traveler の変化のたびにここへ同期することで、
// 既存の getCharacter(id) 呼び出し側(バトル・一覧・スキルツリー等)を
// 変更せずに旅人キャラを扱えるようにしている。
let travelerOverride: CharacterDef | null = null;

export function setTravelerCharacterDef(def: CharacterDef | null): void {
  travelerOverride = def;
}

export function getTravelerCharacterDef(): CharacterDef | null {
  return travelerOverride;
}

export function getCharacter(id: string): CharacterDef | undefined {
  if (travelerOverride && id === travelerOverride.id) return travelerOverride;
  return CHARACTER_MAP[id];
}

/** 旅人(作成済みの場合)を先頭に含めた、一覧・編成画面用のロスター */
export function getRosterCharacters(): CharacterDef[] {
  return travelerOverride ? [travelerOverride, ...CHARACTERS] : CHARACTERS;
}
