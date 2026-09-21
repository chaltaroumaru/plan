import { getCard } from '../data/cards';
import { getCharacter } from '../data/characters';
import {
  BattleCardInstance,
  BattleCharacterState,
  BattleEnemyState,
  BattlePartyState,
  CharacterDef,
  CharacterProgress,
  EnemyDef,
  EnemyIntent,
} from '../types';
import { EffectiveStats, computeEffectiveStats } from './skillTree';

export const HAND_SIZE = 5;
export const MAX_ENERGY = 3;
const ULTIMATE_DAMAGE_MULT = 2.2;
const CRIT_DAMAGE_MULT = 1.5;

// カードのvalueは「対応するキャラのステータスに対する威力の倍率」の素。
// 実際の倍率 = value / CARD_POWER_DIVISOR (例: value10 → 2.0倍)。
// 攻撃カードはatk、スキル(ブロック)カードはdefに掛け合わせて最終値を出す。
const CARD_POWER_DIVISOR = 5;

function cardStatMultiplier(cardValue: number): number {
  return cardValue / CARD_POWER_DIVISOR;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let uidCounter = 0;
function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}_${Date.now()}`;
}

function characterDefName(characterId: string): string {
  return getCharacter(characterId)?.name ?? '味方';
}

function rollEnemyIntent(enemy: EnemyDef, turn: number): EnemyIntent {
  const roll = Math.random();
  if (turn > 1 && roll < 0.15) {
    return { kind: 'defend', value: Math.round(enemy.atk * 0.8) };
  }
  if (turn > 1 && roll < 0.25) {
    return { kind: 'buff', value: 2 };
  }
  const variance = Math.round(enemy.atk * (0.85 + Math.random() * 0.3));
  return { kind: 'attack', value: Math.max(1, variance) };
}

function drawCards(
  drawPile: BattleCardInstance[],
  discardPile: BattleCardInstance[],
  hand: BattleCardInstance[],
  count: number
) {
  let draw = [...drawPile];
  let discard = [...discardPile];
  const nextHand = [...hand];
  for (let i = 0; i < count; i++) {
    if (draw.length === 0) {
      if (discard.length === 0) break;
      draw = shuffle(discard);
      discard = [];
    }
    const card = draw.shift();
    if (card) nextHand.push(card);
  }
  return { drawPile: draw, discardPile: discard, hand: nextHand };
}

export function createBattleCharacter(character: CharacterDef, progress: CharacterProgress): BattleCharacterState {
  const stats: EffectiveStats = computeEffectiveStats(character, progress);
  return {
    uid: nextUid('pc'),
    characterId: character.id,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    block: 0,
    atk: stats.atk,
    def: stats.def,
    critRate: stats.critRate,
    critCutRate: stats.critCutRate,
    elementMatchBonus: stats.elementMatchBonus,
    ultimateAvailable: stats.ultimateUnlocked,
    ultimateReady: false,
    ultimateCooldownLeft: stats.ultimateMaxCooldown,
    ultimateMaxCooldown: stats.ultimateMaxCooldown,
    alive: true,
    awakened: progress.awakened,
  };
}

export function createBattleEnemy(enemy: EnemyDef): BattleEnemyState {
  return {
    uid: nextUid('en'),
    enemyId: enemy.id,
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    block: 0,
    intent: rollEnemyIntent(enemy, 1),
    alive: true,
  };
}

export function createBattleState(
  partyMembers: { character: CharacterDef; progress: CharacterProgress }[],
  deckCardIds: string[],
  enemyDefs: EnemyDef[]
): BattlePartyState {
  const characters = partyMembers.map((m) => createBattleCharacter(m.character, m.progress));
  const enemies = enemyDefs.map((e) => createBattleEnemy(e));
  const drawPile = shuffle(deckCardIds.map((cardId) => ({ uid: nextUid('card'), cardId })));

  const base: BattlePartyState = {
    characters,
    enemies,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    drawPile,
    hand: [],
    discardPile: [],
    turn: 1,
    log: [`戦闘開始! 敵${enemies.length}体が現れた。`],
    isOver: false,
    didWin: false,
  };
  const { drawPile: dp, discardPile: disc, hand } = drawCards(base.drawPile, base.discardPile, base.hand, HAND_SIZE);
  return { ...base, drawPile: dp, discardPile: disc, hand };
}

function applyDamageToEnemy(enemy: BattleEnemyState, rawDamage: number): { enemy: BattleEnemyState; dealt: number } {
  const absorbed = Math.min(enemy.block, rawDamage);
  const toHp = rawDamage - absorbed;
  const hp = Math.max(0, enemy.hp - toHp);
  return {
    enemy: { ...enemy, block: enemy.block - absorbed, hp, alive: hp > 0 },
    dealt: toHp,
  };
}

function applyDamageToCharacter(
  target: BattleCharacterState,
  rawDamage: number
): { target: BattleCharacterState; dealt: number } {
  const afterCutRate = rawDamage * (1 - target.critCutRate / 100);
  const absorbed = Math.min(target.block, afterCutRate);
  const toHp = Math.max(0, afterCutRate - absorbed);
  const hp = Math.max(0, target.hp - toHp);
  return {
    target: { ...target, block: Math.max(0, target.block - absorbed), hp, alive: hp > 0 },
    dealt: Math.round(toHp),
  };
}

function checkBattleEnd(state: BattlePartyState): BattlePartyState {
  const enemiesAllDead = state.enemies.every((e) => !e.alive);
  const alliesAllDead = state.characters.every((c) => !c.alive);
  if (enemiesAllDead) {
    return { ...state, isOver: true, didWin: true };
  }
  if (alliesAllDead) {
    return { ...state, isOver: true, didWin: false };
  }
  return state;
}

export function playCard(
  state: BattlePartyState,
  cardUid: string,
  actorUid: string,
  targetEnemyUid?: string
): BattlePartyState {
  if (state.isOver) return state;
  const inst = state.hand.find((c) => c.uid === cardUid);
  const actor = state.characters.find((c) => c.uid === actorUid && c.alive);
  if (!inst || !actor) return state;
  const card = getCard(inst.cardId);
  if (state.energy < card.cost) return state;

  const characterDef = getCharacter(actor.characterId);
  const elementMatch = !!card.element && !!characterDef && card.element === characterDef.element;

  let next: BattlePartyState = {
    ...state,
    energy: state.energy - card.cost,
    hand: state.hand.filter((c) => c.uid !== cardUid),
    discardPile: [...state.discardPile, inst],
    log: [...state.log],
  };

  if (card.type === 'attack') {
    const target = next.enemies.find((e) => e.uid === targetEnemyUid && e.alive);
    if (!target) return state;
    let raw = actor.atk * cardStatMultiplier(card.value);
    if (elementMatch) raw *= 1 + actor.elementMatchBonus / 100;
    const isCrit = Math.random() * 100 < actor.critRate;
    if (isCrit) raw *= CRIT_DAMAGE_MULT;
    const { enemy: updatedEnemy, dealt } = applyDamageToEnemy(target, Math.round(raw));
    next.enemies = next.enemies.map((e) => (e.uid === target.uid ? updatedEnemy : e));
    next.log = [
      ...next.log,
      `${characterDef?.name ?? ''}の${card.name} → ${dealt}ダメージ${isCrit ? '(クリティカル!)' : ''}`,
    ];
  } else if (card.type === 'skill') {
    const blockGain = Math.max(1, Math.round(actor.def * cardStatMultiplier(card.value)));
    next.characters = next.characters.map((c) =>
      c.uid === actor.uid ? { ...c, block: c.block + blockGain } : c
    );
    next.log = [...next.log, `${characterDef?.name ?? ''}の${card.name} → ブロック+${blockGain}`];
  } else if (card.type === 'power') {
    next.characters = next.characters.map((c) =>
      c.uid === actor.uid ? { ...c, atk: c.atk + card.value } : c
    );
    next.log = [...next.log, `${characterDef?.name ?? ''}の${card.name} → 攻撃力+${card.value}(この戦闘中)`];
  }

  return checkBattleEnd(next);
}

export function useUltimate(state: BattlePartyState, actorUid: string, targetEnemyUid: string): BattlePartyState {
  if (state.isOver) return state;
  const actor = state.characters.find((c) => c.uid === actorUid && c.alive);
  const target = state.enemies.find((e) => e.uid === targetEnemyUid && e.alive);
  if (!actor || !target || !actor.ultimateReady) return state;

  const characterDef = getCharacter(actor.characterId);
  const raw = Math.round(actor.atk * ULTIMATE_DAMAGE_MULT);
  const { enemy: updatedEnemy, dealt } = applyDamageToEnemy(target, raw);

  let next: BattlePartyState = {
    ...state,
    enemies: state.enemies.map((e) => (e.uid === target.uid ? updatedEnemy : e)),
    characters: state.characters.map((c) =>
      c.uid === actor.uid
        ? { ...c, ultimateReady: false, ultimateCooldownLeft: c.ultimateMaxCooldown }
        : c
    ),
    log: [...state.log, `${characterDef?.name ?? ''}の必殺技! → ${dealt}ダメージ!`],
  };

  return checkBattleEnd(next);
}

export function endTurn(state: BattlePartyState, enemyDefs: Record<string, EnemyDef>): BattlePartyState {
  if (state.isOver) return state;

  let next: BattlePartyState = {
    ...state,
    discardPile: [...state.discardPile, ...state.hand],
    hand: [],
    log: [...state.log],
  };

  // 敵の行動を順番に処理
  next.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    const enemyDef = enemyDefs[enemy.enemyId];
    const aliveAllies = next.characters.filter((c) => c.alive);
    if (aliveAllies.length === 0) return;

    if (enemy.intent.kind === 'attack') {
      const targetAlly = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
      const { target: updatedAlly, dealt } = applyDamageToCharacter(targetAlly, enemy.intent.value);
      next.characters = next.characters.map((c) => (c.uid === targetAlly.uid ? updatedAlly : c));
      next.log = [...next.log, `${enemyDef?.name ?? '敵'}の攻撃 → ${characterDefName(targetAlly.characterId)}に${dealt}ダメージ!`];
    } else if (enemy.intent.kind === 'defend') {
      const blockGain = enemy.intent.value;
      next.enemies = next.enemies.map((e) => (e.uid === enemy.uid ? { ...e, block: e.block + blockGain } : e));
      next.log = [...next.log, `${enemyDef?.name ?? '敵'}は身を守っている`];
    } else if (enemy.intent.kind === 'buff') {
      next.log = [...next.log, `${enemyDef?.name ?? '敵'}は力を高めた!`];
    }
  });

  next = checkBattleEnd(next);
  if (next.isOver) return next;

  // 次ラウンドの準備: ブロックリセット・必殺技ゲージ進行・新しい意図の決定
  next.turn += 1;
  next.energy = next.maxEnergy;
  next.characters = next.characters.map((c) => {
    if (!c.alive) return { ...c, block: 0 };
    if (!c.ultimateAvailable) return { ...c, block: 0 };
    if (c.ultimateReady) return { ...c, block: 0 };
    const cooldownLeft = Math.max(0, c.ultimateCooldownLeft - 1);
    return { ...c, block: 0, ultimateCooldownLeft: cooldownLeft, ultimateReady: cooldownLeft === 0 };
  });
  next.enemies = next.enemies.map((e) => {
    if (!e.alive) return e;
    const enemyDef = enemyDefs[e.enemyId];
    return enemyDef ? { ...e, intent: rollEnemyIntent(enemyDef, next.turn) } : e;
  });

  const { drawPile, discardPile, hand } = drawCards(next.drawPile, next.discardPile, next.hand, HAND_SIZE);
  next.drawPile = drawPile;
  next.discardPile = discardPile;
  next.hand = hand;

  return next;
}
