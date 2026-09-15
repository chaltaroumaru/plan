import { DungeonCategory, MaterialType } from '../types';

export const MATERIAL_LABEL: Record<MaterialType, string> = {
  enhance: '強化素材',
  evolve: '進化素材',
  unlock: '解放素材',
  memory: '記憶のかけら',
};

export const MATERIAL_EMOJI: Record<MaterialType, string> = {
  enhance: '🔧',
  evolve: '🧬',
  unlock: '🗝️',
  memory: '🧩',
};

export const DUNGEON_CATEGORY_LABEL: Record<DungeonCategory, string> = {
  enhance: '強化素材クエスト',
  evolve: '進化素材クエスト',
  unlock: 'スキルツリー解放素材クエスト',
  memory: '記憶のかけらクエスト',
  raid: '降臨',
  event: 'イベント',
};

export const DUNGEON_CATEGORY_EMOJI: Record<DungeonCategory, string> = {
  enhance: '🔧',
  evolve: '🧬',
  unlock: '🗝️',
  memory: '🧩',
  raid: '🐲',
  event: '🎪',
};

export const AP_MAX = 30;
export const AP_RECOVER_MINUTES = 3; // 1AP回復にかかる分数
