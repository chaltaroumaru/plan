import { CharacterProgress } from '../types';

export const MAX_LEVEL = 30;

export function expForNextLevel(level: number): number {
  return 20 + level * 15;
}

export function createInitialProgress(): CharacterProgress {
  return { level: 1, exp: 0, skillPoints: 0, allocatedNodeIds: [], awakened: false };
}

export function grantExp(progress: CharacterProgress, expGained: number): CharacterProgress {
  let { level, exp, skillPoints } = progress;
  exp += expGained;
  while (level < MAX_LEVEL && exp >= expForNextLevel(level)) {
    exp -= expForNextLevel(level);
    level += 1;
    skillPoints += 1;
  }
  if (level >= MAX_LEVEL) {
    exp = 0;
  }
  return { ...progress, level, exp, skillPoints };
}
