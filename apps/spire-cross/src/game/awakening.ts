import { CharacterDef, CharacterProgress, PlayerProfile } from '../types';

export const AWAKENING_REQUIRED_LEVEL = 10;
export const AWAKENING_REQUIRED_MEMORY = 15;
/** 覚醒時にHP/攻撃力/防御力へ掛かる倍率ボーナス */
export const AWAKENING_STAT_BONUS = 0.12;

export interface AwakenCheck {
  ok: boolean;
  reason?: string;
}

export function canAwaken(
  character: CharacterDef,
  progress: CharacterProgress,
  profile: PlayerProfile
): AwakenCheck {
  if (progress.awakened) {
    return { ok: false, reason: 'すでに覚醒済みです' };
  }
  if (progress.level < AWAKENING_REQUIRED_LEVEL) {
    return { ok: false, reason: `Lv${AWAKENING_REQUIRED_LEVEL}以上が必要です(現在Lv${progress.level})` };
  }
  const memory = profile.materials.memory ?? 0;
  if (memory < AWAKENING_REQUIRED_MEMORY) {
    return { ok: false, reason: `記憶のかけらが足りません(必要:${AWAKENING_REQUIRED_MEMORY} / 所持:${memory})` };
  }
  return { ok: true };
}

export function awakenCharacter(
  profile: PlayerProfile,
  character: CharacterDef,
  progress: CharacterProgress
): PlayerProfile {
  const check = canAwaken(character, progress, profile);
  if (!check.ok) {
    throw new Error(check.reason ?? '覚醒条件を満たしていません');
  }
  return {
    ...profile,
    materials: { ...profile.materials, memory: (profile.materials.memory ?? 0) - AWAKENING_REQUIRED_MEMORY },
    characterProgress: {
      ...profile.characterProgress,
      [character.id]: { ...progress, awakened: true },
    },
  };
}
