import { CHARACTERS } from '../data/characters';
import { GachaPullResult, PlayerProfile, Rarity } from '../types';

export const SINGLE_PULL_COST = 150;
export const TEN_PULL_COST = 1350;
export const PITY_LIMIT = 60;

const BASE_RATES: Record<Rarity, number> = {
  N: 0.5,
  R: 0.35,
  SR: 0.12,
  SSR: 0.03,
};

function rollRarity(pityCounter: number): Rarity {
  if (pityCounter >= PITY_LIMIT - 1) {
    return 'SSR';
  }
  const roll = Math.random();
  let acc = 0;
  const order: Rarity[] = ['SSR', 'SR', 'R', 'N'];
  for (const rarity of order) {
    acc += BASE_RATES[rarity];
    if (roll <= acc) {
      return rarity;
    }
  }
  return 'N';
}

function pickCharacterOfRarity(rarity: Rarity) {
  const pool = CHARACTERS.filter((c) => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface GachaOutcome {
  pulls: GachaPullResult[];
  profile: PlayerProfile;
  goldFromDupes: number;
}

function doSinglePull(profile: PlayerProfile): { result: GachaPullResult; pity: number } {
  const rarity = rollRarity(profile.pityCounter);
  const character = pickCharacterOfRarity(rarity);
  const isNew = !profile.ownedCharacterIds.includes(character.id);
  const pity = rarity === 'SSR' ? 0 : profile.pityCounter + 1;
  return { result: { characterId: character.id, rarity, isNew }, pity };
}

export function pullGacha(profile: PlayerProfile, count: 1 | 10): GachaOutcome {
  const cost = count === 1 ? SINGLE_PULL_COST : TEN_PULL_COST;
  if (profile.gems < cost) {
    throw new Error('ジェムが足りません');
  }

  let working: PlayerProfile = {
    ...profile,
    gems: profile.gems - cost,
    ownedCharacterIds: [...profile.ownedCharacterIds],
  };

  const pulls: GachaPullResult[] = [];
  let goldFromDupes = 0;

  for (let i = 0; i < count; i++) {
    const { result, pity } = doSinglePull(working);
    working.pityCounter = pity;
    working.totalPulls += 1;
    if (result.isNew) {
      working.ownedCharacterIds.push(result.characterId);
    } else {
      const dupeGold = { N: 10, R: 20, SR: 50, SSR: 150 }[result.rarity];
      goldFromDupes += dupeGold;
    }
    pulls.push(result);
  }

  // 10連保証: R以上が1体もいなければ最後の1体をRに差し替える
  if (count === 10 && pulls.every((p) => p.rarity === 'N')) {
    const guaranteed = pickCharacterOfRarity('R');
    const isNew = !working.ownedCharacterIds.includes(guaranteed.id);
    if (isNew) {
      working.ownedCharacterIds.push(guaranteed.id);
    } else {
      goldFromDupes += 20;
    }
    pulls[pulls.length - 1] = { characterId: guaranteed.id, rarity: 'R', isNew };
  }

  working.gold += goldFromDupes;

  return { pulls, profile: working, goldFromDupes };
}
