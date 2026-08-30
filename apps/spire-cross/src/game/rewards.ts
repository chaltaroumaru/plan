import { getCharacter } from '../data/characters';
import { CardDef } from '../types';
import { getCard } from '../data/cards';

export function pickCardRewards(partyIds: string[], count: number): CardDef[] {
  const pool = Array.from(
    new Set(
      partyIds.flatMap((id) => getCharacter(id)?.cardIds ?? [])
    )
  );
  if (pool.length === 0) return [];
  const picks: string[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) {
    picks.push(shuffled[i % shuffled.length]);
  }
  return picks.map((id) => getCard(id));
}

export function goldRewardFor(kind: 'battle' | 'elite'): number {
  if (kind === 'elite') return 60 + Math.floor(Math.random() * 30);
  return 20 + Math.floor(Math.random() * 16);
}

export function gemRewardFor(kind: 'elite' | 'boss'): number {
  if (kind === 'boss') return 200;
  return 30;
}
