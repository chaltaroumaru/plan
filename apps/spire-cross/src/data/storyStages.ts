import { StoryStageDef } from '../types';

export const STORY_STAGES: StoryStageDef[] = [
  {
    id: 'story_1_1',
    chapter: 1,
    order: 1,
    title: '出会い',
    flavorText:
      '境界の交わる塔のふもとで、旅人は目を覚ました。行く手を阻む小さな魔物たちを退け、塔を昇る旅が始まる。',
    enemyIds: ['slime'],
    rewardGold: 20,
    rewardStones: 10,
    rewardExp: 15,
  },
  {
    id: 'story_1_2',
    chapter: 1,
    order: 2,
    title: '境界のほころび',
    flavorText: '塔の壁面に亀裂が走り、異界からの魔物たちが漏れ出してくる。数の脅威に立ち向かえ。',
    enemyIds: ['goblin', 'bat'],
    rewardGold: 30,
    rewardStones: 15,
    rewardExp: 20,
  },
  {
    id: 'story_1_3',
    chapter: 1,
    order: 3,
    title: '交界石の導き',
    flavorText: '塔の中腹で、淡く光る交界石の欠片を見つけた。その光は、まだ見ぬ道を示しているようだった。',
    enemyIds: ['orc'],
    rewardGold: 40,
    rewardStones: 20,
    rewardExp: 25,
  },
  {
    id: 'story_1_4',
    chapter: 1,
    order: 4,
    title: '塔の番人',
    flavorText: '第一章の最後に立ちはだかるのは、塔を守る堕ちた騎士。ここを越えれば、新たな景色が広がるはずだ。',
    enemyIds: ['elite_knight'],
    rewardGold: 60,
    rewardStones: 30,
    rewardExp: 40,
  },
];

export const STORY_STAGE_MAP: Record<string, StoryStageDef> = Object.fromEntries(
  STORY_STAGES.map((s) => [s.id, s])
);

export function getNextStoryStage(clearedIds: string[]): StoryStageDef | null {
  const sorted = [...STORY_STAGES].sort((a, b) => a.order - b.order);
  return sorted.find((s) => !clearedIds.includes(s.id)) ?? null;
}

export function isStoryStageUnlocked(stage: StoryStageDef, clearedIds: string[]): boolean {
  const sorted = [...STORY_STAGES].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === stage.id);
  if (idx <= 0) return true;
  return clearedIds.includes(sorted[idx - 1].id);
}
