import { BASIC_CARDS } from '../data/cards';
import { PlayerProfile } from '../types';

export const DECK_MIN_SIZE = 10;
export const DECK_MAX_SIZE = 20;
export const BASIC_CARD_MAX_COPIES = 6;

const BASIC_CARD_IDS = new Set(BASIC_CARDS.map((c) => c.id));

export function maxCopiesAllowed(cardId: string, profile: PlayerProfile): number {
  if (BASIC_CARD_IDS.has(cardId)) return BASIC_CARD_MAX_COPIES;
  return profile.ownedCardCounts[cardId] ?? 0;
}

export interface DeckPoolEntry {
  cardId: string;
  max: number;
}

export function availableCardPool(profile: PlayerProfile): DeckPoolEntry[] {
  const basic = BASIC_CARDS.map((c) => ({ cardId: c.id, max: BASIC_CARD_MAX_COPIES }));
  const owned = Object.entries(profile.ownedCardCounts)
    .filter(([, count]) => count > 0)
    .map(([cardId, count]) => ({ cardId, max: count }));
  return [...basic, ...owned];
}

export function countInDeck(deck: string[], cardId: string): number {
  return deck.filter((id) => id === cardId).length;
}

export function canAddCardToDeck(deck: string[], cardId: string, profile: PlayerProfile): boolean {
  if (deck.length >= DECK_MAX_SIZE) return false;
  return countInDeck(deck, cardId) < maxCopiesAllowed(cardId, profile);
}

export function buildDefaultDeck(profile: PlayerProfile): string[] {
  const deck: string[] = [];
  for (let i = 0; i < 4; i++) deck.push('basic_strike');
  for (let i = 0; i < 4; i++) deck.push('basic_defend');
  Object.entries(profile.ownedCardCounts).forEach(([cardId, count]) => {
    for (let i = 0; i < count && deck.length < DECK_MAX_SIZE; i++) {
      deck.push(cardId);
    }
  });
  return deck;
}

export function isDeckValid(deck: string[]): boolean {
  return deck.length >= DECK_MIN_SIZE && deck.length <= DECK_MAX_SIZE;
}
