import { CharacterDef, PlayerRole, TravelerBuild } from '../types';
import { ROLE_COLOR, ROLE_ELEMENT, ROLE_EMOJI, ROLE_LABEL, ROLE_STAT_MODIFIER, ROLE_TITLE } from '../data/roles';

export const TRAVELER_ID = 'traveler';

/** ポイント振り分けの上限。3ステータス(HP/攻撃力/防御力)に自由配分する。 */
export const STAT_POINT_POOL = 20;

/** ポイント配分前の素の基礎値(N相当)。 */
const TRAVELER_BASE = { hp: 40, atk: 8, def: 4 };

/** 1ポイントあたりの伸び幅。HPが伸びやすく、防御力は伸びにくい。 */
const POINT_GAIN = { hp: 3, atk: 1, def: 0.6 };

/** 固定のレアリティ(スキルツリー効果量のスケーリングにのみ使用)。 */
const TRAVELER_RARITY = 'SR' as const;

export function createDefaultTravelerBuild(name: string, role: PlayerRole = 'pierce'): TravelerBuild {
  return { name, role, allocatedPoints: { hp: 0, atk: 0, def: 0 } };
}

export function usedPoints(build: TravelerBuild): number {
  return build.allocatedPoints.hp + build.allocatedPoints.atk + build.allocatedPoints.def;
}

export function remainingPoints(build: TravelerBuild): number {
  return STAT_POINT_POOL - usedPoints(build);
}

export function computeTravelerBaseStats(build: TravelerBuild): { hp: number; atk: number; def: number } {
  const mod = ROLE_STAT_MODIFIER[build.role];
  const hp = TRAVELER_BASE.hp + build.allocatedPoints.hp * POINT_GAIN.hp + mod.hp;
  const atk = TRAVELER_BASE.atk + build.allocatedPoints.atk * POINT_GAIN.atk + mod.atk;
  const def = TRAVELER_BASE.def + build.allocatedPoints.def * POINT_GAIN.def + mod.def;
  return {
    hp: Math.max(1, Math.round(hp)),
    atk: Math.max(1, Math.round(atk)),
    def: Math.max(0, Math.round(def)),
  };
}

export function buildTravelerCharacterDef(build: TravelerBuild): CharacterDef {
  const stats = computeTravelerBaseStats(build);
  return {
    id: TRAVELER_ID,
    name: build.name.trim() || '旅人',
    title: ROLE_TITLE[build.role],
    rarity: TRAVELER_RARITY,
    element: ROLE_ELEMENT[build.role],
    color: ROLE_COLOR[build.role],
    emoji: ROLE_EMOJI[build.role],
    baseHp: stats.hp,
    baseAtk: stats.atk,
    baseDef: stats.def,
    signatureCardId: '',
    cardIds: ['', ''],
    travelerRole: build.role,
  };
}

export function roleDisplayName(role: PlayerRole): string {
  return ROLE_LABEL[role];
}
