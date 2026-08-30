import { EnemyDef } from '../types';

export const ENEMIES_EARLY: EnemyDef[] = [
  { id: 'slime', name: 'スライム', emoji: '🟢', maxHp: 24, atk: 5 },
  { id: 'goblin', name: 'ゴブリン', emoji: '👺', maxHp: 28, atk: 6 },
  { id: 'bat', name: 'デーモンバット', emoji: '🦇', maxHp: 20, atk: 4 },
];

export const ENEMIES_MID: EnemyDef[] = [
  { id: 'orc', name: 'オーク戦士', emoji: '👹', maxHp: 42, atk: 8 },
  { id: 'skeleton', name: '骸骨兵', emoji: '💀', maxHp: 38, atk: 9 },
  { id: 'wolf', name: '影狼', emoji: '🐺', maxHp: 34, atk: 10 },
];

export const ENEMIES_LATE: EnemyDef[] = [
  { id: 'ogre', name: '巨大オーガ', emoji: '🧌', maxHp: 60, atk: 12 },
  { id: 'wraith', name: '亡霊騎士', emoji: '👻', maxHp: 54, atk: 13 },
  { id: 'golem', name: '石の巨人', emoji: '🗿', maxHp: 70, atk: 10 },
];

export const ELITES: EnemyDef[] = [
  { id: 'elite_knight', name: '堕ちた騎士', emoji: '⚔️', maxHp: 65, atk: 11, isElite: true },
  { id: 'elite_witch', name: '呪術師', emoji: '🧙', maxHp: 58, atk: 13, isElite: true },
];

export const BOSSES: EnemyDef[] = [
  { id: 'boss_dragon', name: '古き災厄の竜', emoji: '🐲', maxHp: 140, atk: 16, isBoss: true },
];

export const ENEMY_MAP: Record<string, EnemyDef> = Object.fromEntries(
  [...ENEMIES_EARLY, ...ENEMIES_MID, ...ENEMIES_LATE, ...ELITES, ...BOSSES].map((e) => [e.id, e])
);

export function getEnemy(id: string): EnemyDef {
  const enemy = ENEMY_MAP[id];
  if (!enemy) {
    throw new Error(`Unknown enemy id: ${id}`);
  }
  return enemy;
}

export function pickRandomEnemy(floor: number): EnemyDef {
  const pool = floor <= 2 ? ENEMIES_EARLY : floor <= 4 ? ENEMIES_MID : ENEMIES_LATE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomElite(): EnemyDef {
  return ELITES[Math.floor(Math.random() * ELITES.length)];
}

export function pickBoss(): EnemyDef {
  return BOSSES[Math.floor(Math.random() * BOSSES.length)];
}
