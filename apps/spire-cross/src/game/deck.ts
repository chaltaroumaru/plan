import { BASIC_CARDS } from '../data/cards';
import { getCharacter } from '../data/characters';

export const BASE_PLAYER_HP = 50;
export const STARTER_BASIC_STRIKES = 4;
export const STARTER_BASIC_DEFENDS = 4;

export function buildStartingDeck(partyIds: string[]): string[] {
  const deck: string[] = [];
  for (let i = 0; i < STARTER_BASIC_STRIKES; i++) deck.push(BASIC_CARDS[0].id);
  for (let i = 0; i < STARTER_BASIC_DEFENDS; i++) deck.push(BASIC_CARDS[1].id);
  partyIds.forEach((id) => {
    const character = getCharacter(id);
    if (character) {
      deck.push(...character.cardIds);
    }
  });
  return deck;
}

export function computeMaxHp(partyIds: string[]): number {
  const bonus = partyIds.reduce((sum, id) => {
    const character = getCharacter(id);
    return sum + (character?.bonusHp ?? 0);
  }, 0);
  return BASE_PLAYER_HP + bonus;
}
