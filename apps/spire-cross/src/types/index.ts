export type Rarity = 'N' | 'R' | 'SR' | 'SSR';

export type Element = '火' | '水' | '風' | '土' | '雷' | '光' | '闇';

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  element: Element;
  color: string;
  emoji: string;
  bonusHp: number;
  cardIds: [string, string];
}

export type CardType = 'attack' | 'skill' | 'power';

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  value: number;
  description: string;
  ownerId: string | 'basic';
  rarity: Rarity;
  upgraded?: boolean;
}

export type EnemyIntent =
  | { kind: 'attack'; value: number }
  | { kind: 'defend'; value: number }
  | { kind: 'buff'; value: number };

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  atk: number;
  isBoss?: boolean;
  isElite?: boolean;
}

export type NodeType = 'battle' | 'elite' | 'rest' | 'shop' | 'event' | 'boss';

export interface RunNode {
  id: string;
  floor: number;
  col: number;
  type: NodeType;
  enemyId?: string;
  connections: string[];
  visited: boolean;
}

export interface RunState {
  nodes: RunNode[];
  currentNodeId: string | null;
  deck: string[];
  hp: number;
  maxHp: number;
  partyIds: string[];
  strength: number;
  floor: number;
  pendingBattleNodeId?: string;
}

export interface PlayerProfile {
  gold: number;
  gems: number;
  ownedCharacterIds: string[];
  pityCounter: number;
  totalPulls: number;
  bestFloorCleared: number;
}

export interface BattleCardInstance {
  uid: string;
  cardId: string;
}

export interface BattleState {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyBlock: number;
  enemyAtkBonus: number;
  enemyIntent: EnemyIntent;
  playerHp: number;
  playerMaxHp: number;
  playerBlock: number;
  strength: number;
  energy: number;
  maxEnergy: number;
  drawPile: BattleCardInstance[];
  hand: BattleCardInstance[];
  discardPile: BattleCardInstance[];
  turn: number;
  log: string[];
  isOver: boolean;
  didWin: boolean;
}

export interface GachaPullResult {
  characterId: string;
  rarity: Rarity;
  isNew: boolean;
}
