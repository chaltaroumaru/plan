import { CHARACTERS } from '../data/characters';
import { CHARACTER_CARDS } from '../data/cards';
import { GachaPoolKind, GachaPullResult, PlayerProfile, Rarity } from '../types';

export const SINGLE_PULL_COST = 5;
export const TEN_PULL_COST = 50;
export const MULTI_PULL_COUNT = 11; // 10連+1のおまけ枠
export const PITY_LIMIT = 60;

const BASE_RATES: Record<Rarity, number> = {
  N: 0.5,
  R: 0.35,
  SR: 0.12,
  SSR: 0.03,
};

const DUPE_GOLD: Record<Rarity, number> = { N: 10, R: 20, SR: 50, SSR: 150 };

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

function poolFor(pool: GachaPoolKind) {
  return pool === 'character' ? CHARACTERS : CHARACTER_CARDS;
}

function pickOfRarity(pool: GachaPoolKind, rarity: Rarity) {
  const candidates = poolFor(pool).filter((c) => c.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export interface GachaOutcome {
  pulls: GachaPullResult[];
  profile: PlayerProfile;
  goldFromDupes: number;
}

export function pullGacha(
  profile: PlayerProfile,
  pool: GachaPoolKind,
  count: 1 | typeof MULTI_PULL_COUNT
): GachaOutcome {
  const cost = count === 1 ? SINGLE_PULL_COST : TEN_PULL_COST;
  if (profile.stones < cost) {
    throw new Error('交界石が足りません');
  }

  const working: PlayerProfile = {
    ...profile,
    stones: profile.stones - cost,
    ownedCharacterCounts: { ...profile.ownedCharacterCounts },
    ownedCardCounts: { ...profile.ownedCardCounts },
  };

  const pulls: GachaPullResult[] = [];
  let goldFromDupes = 0;
  let pity = pool === 'character' ? working.charPity : working.cardPity;

  const applyPull = (rarity: Rarity, item: { id: string }) => {
    const counts = pool === 'character' ? working.ownedCharacterCounts : working.ownedCardCounts;
    const isNew = !counts[item.id];
    counts[item.id] = (counts[item.id] ?? 0) + 1;
    if (pool === 'character' && !isNew) {
      goldFromDupes += DUPE_GOLD[rarity];
    }
    pulls.push({ pool, id: item.id, rarity, isNew });
    pity = rarity === 'SSR' ? 0 : pity + 1;
  };

  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(pity);
    const item = pickOfRarity(pool, rarity);
    applyPull(rarity, item);
  }

  // 10+1連保証: R以上が1体もいなければ最後の1体をRに差し替える
  if (count === MULTI_PULL_COUNT && pulls.every((p) => p.rarity === 'N')) {
    const last = pulls[pulls.length - 1];
    const counts = pool === 'character' ? working.ownedCharacterCounts : working.ownedCardCounts;
    counts[last.id] -= 1;
    if (counts[last.id] <= 0) delete counts[last.id];

    const guaranteed = pickOfRarity(pool, 'R');
    const isNew = !counts[guaranteed.id];
    counts[guaranteed.id] = (counts[guaranteed.id] ?? 0) + 1;
    if (pool === 'character' && !isNew) {
      goldFromDupes += DUPE_GOLD.R;
    }
    pulls[pulls.length - 1] = { pool, id: guaranteed.id, rarity: 'R', isNew };
  }

  working.gold += goldFromDupes;
  if (pool === 'character') {
    working.charPity = pity;
    working.totalCharPulls += count;
  } else {
    working.cardPity = pity;
    working.totalCardPulls += count;
  }

  return { pulls, profile: working, goldFromDupes };
}
