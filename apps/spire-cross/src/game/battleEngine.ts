import { getCard } from '../data/cards';
import { BattleCardInstance, BattleState, EnemyDef, EnemyIntent } from '../types';

export const HAND_SIZE = 5;
export const MAX_ENERGY = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `card_${uidCounter}_${Date.now()}`;
}

function rollEnemyIntent(enemy: EnemyDef, atkBonus: number, turn: number): EnemyIntent {
  const roll = Math.random();
  if (turn > 1 && roll < 0.15) {
    return { kind: 'defend', value: Math.round(enemy.atk * 0.8) };
  }
  if (turn > 1 && roll < 0.25) {
    return { kind: 'buff', value: 2 };
  }
  const variance = Math.round((enemy.atk + atkBonus) * (0.85 + Math.random() * 0.3));
  return { kind: 'attack', value: Math.max(1, variance) };
}

function drawCards(state: BattleState, count: number): BattleState {
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];
  const hand = [...state.hand];
  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile);
      discardPile = [];
    }
    const card = drawPile.shift();
    if (card) hand.push(card);
  }
  return { ...state, drawPile, discardPile, hand };
}

export function createBattleState(
  enemy: EnemyDef,
  deckCardIds: string[],
  playerHp: number,
  playerMaxHp: number,
  strength: number
): BattleState {
  const drawPile: BattleCardInstance[] = shuffle(
    deckCardIds.map((cardId) => ({ uid: nextUid(), cardId }))
  );
  const base: BattleState = {
    enemyId: enemy.id,
    enemyHp: enemy.maxHp,
    enemyMaxHp: enemy.maxHp,
    enemyBlock: 0,
    enemyAtkBonus: 0,
    enemyIntent: rollEnemyIntent(enemy, 0, 1),
    playerHp,
    playerMaxHp,
    playerBlock: 0,
    strength,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    drawPile,
    hand: [],
    discardPile: [],
    turn: 1,
    log: [`${enemy.name}が現れた!`],
    isOver: false,
    didWin: false,
  };
  return drawCards(base, HAND_SIZE);
}

export function playCard(state: BattleState, uid: string, enemyName: string): BattleState {
  if (state.isOver) return state;
  const inst = state.hand.find((c) => c.uid === uid);
  if (!inst) return state;
  const card = getCard(inst.cardId);
  if (state.energy < card.cost) return state;

  let next: BattleState = {
    ...state,
    energy: state.energy - card.cost,
    hand: state.hand.filter((c) => c.uid !== uid),
    discardPile: [...state.discardPile, inst],
    log: [...state.log],
  };

  if (card.type === 'attack') {
    const rawDamage = card.value + next.strength;
    const absorbed = Math.min(next.enemyBlock, rawDamage);
    const dmgToHp = rawDamage - absorbed;
    next.enemyBlock -= absorbed;
    next.enemyHp = Math.max(0, next.enemyHp - dmgToHp);
    next.log = [...next.log, `${card.name} → ${enemyName}に${dmgToHp}ダメージ!`];
    if (next.enemyHp <= 0) {
      next.isOver = true;
      next.didWin = true;
      next.log = [...next.log, `${enemyName}を撃破した!`];
    }
  } else if (card.type === 'skill') {
    next.playerBlock += card.value;
    next.log = [...next.log, `${card.name} → ブロック+${card.value}`];
  } else if (card.type === 'power') {
    next.strength += card.value;
    next.log = [...next.log, `${card.name} → 筋力+${card.value} (この後の戦闘にも継続)`];
  }

  return next;
}

export function endTurn(state: BattleState, enemy: EnemyDef): BattleState {
  if (state.isOver) return state;

  let next: BattleState = {
    ...state,
    discardPile: [...state.discardPile, ...state.hand],
    hand: [],
    log: [...state.log],
  };

  const intent = next.enemyIntent;
  if (intent.kind === 'attack') {
    const absorbed = Math.min(next.playerBlock, intent.value);
    const dmgToHp = intent.value - absorbed;
    next.playerBlock -= absorbed;
    next.playerHp = Math.max(0, next.playerHp - dmgToHp);
    next.log = [...next.log, `${enemy.name}の攻撃 → ${dmgToHp}ダメージ!`];
    if (next.playerHp <= 0) {
      next.isOver = true;
      next.didWin = false;
      next.log = [...next.log, '倒れてしまった…'];
      return next;
    }
  } else if (intent.kind === 'defend') {
    next.enemyBlock += intent.value;
    next.log = [...next.log, `${enemy.name}は身を守っている(ブロック+${intent.value})`];
  } else if (intent.kind === 'buff') {
    next.enemyAtkBonus += intent.value;
    next.log = [...next.log, `${enemy.name}は力を高めた!`];
  }

  next.turn += 1;
  next.playerBlock = 0;
  next.energy = next.maxEnergy;
  next = drawCards(next, HAND_SIZE);
  next.enemyIntent = rollEnemyIntent(enemy, next.enemyAtkBonus, next.turn);

  return next;
}
