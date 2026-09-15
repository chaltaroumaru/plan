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
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  /** このキャラのスキルツリー特殊ノードの解放条件になるカード */
  signatureCardId: string;
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
  /** フレーバー上の関連キャラ(スキルツリー連動に使用)。基本カードはnull */
  linkedCharacterId: string | null;
  element: Element | null;
  rarity: Rarity;
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

export type MaterialType = 'enhance' | 'evolve' | 'unlock';

export type DungeonCategory = 'enhance' | 'evolve' | 'unlock' | 'raid' | 'event';

export interface DungeonStageDef {
  id: string;
  category: DungeonCategory;
  name: string;
  apCost: number;
  enemyIds: string[];
  rewardGold: number;
  rewardMaterial: { type: MaterialType; amount: number } | null;
  rewardStones: number;
}

export interface StoryStageDef {
  id: string;
  chapter: number;
  order: number;
  title: string;
  flavorText: string;
  enemyIds: string[];
  rewardGold: number;
  rewardStones: number;
  rewardExp: number;
}

export type SkillTreeEffect =
  | { kind: 'hp'; amount: number }
  | { kind: 'atk'; amount: number }
  | { kind: 'def'; amount: number }
  | { kind: 'critRate'; amount: number }
  | { kind: 'critCutRate'; amount: number }
  | { kind: 'ultimateCooldown'; amount: number }
  | { kind: 'elementMatchBonus'; amount: number }
  | { kind: 'ultimateUnlock' };

export interface SkillTreeNodeDef {
  id: string;
  label: string;
  description: string;
  cost: number;
  effect: SkillTreeEffect;
  requiresNodeIds: string[];
  requiresSignatureCard?: boolean;
  requiresMaterial?: { type: MaterialType; amount: number };
  requiresTotalSpent?: number;
}

export interface CharacterProgress {
  level: number;
  exp: number;
  skillPoints: number;
  allocatedNodeIds: string[];
}

export interface ApState {
  current: number;
  updatedAt: string; // ISO timestamp
}

export interface GameSettings {
  bgmOn: boolean;
  seOn: boolean;
  notifyMissionComplete: boolean;
  notifyApFull: boolean;
}

export interface PlayerProfile {
  gold: number;
  stones: number; // 交界石
  ap: ApState;
  materials: Record<MaterialType, number>;
  ownedCharacterCounts: Record<string, number>;
  ownedCardCounts: Record<string, number>;
  characterProgress: Record<string, CharacterProgress>;
  partyIds: string[];
  deckCardIds: string[];
  charPity: number;
  cardPity: number;
  totalCharPulls: number;
  totalCardPulls: number;
  clearedStoryStageIds: string[];
  settings: GameSettings;
}

export interface BattleCharacterState {
  uid: string;
  characterId: string;
  hp: number;
  maxHp: number;
  block: number;
  atk: number;
  def: number;
  critRate: number;
  critCutRate: number;
  elementMatchBonus: number;
  ultimateReady: boolean;
  ultimateAvailable: boolean;
  ultimateCooldownLeft: number;
  ultimateMaxCooldown: number;
  alive: boolean;
}

export interface BattleEnemyState {
  uid: string;
  enemyId: string;
  hp: number;
  maxHp: number;
  block: number;
  intent: EnemyIntent;
  alive: boolean;
}

export interface BattleCardInstance {
  uid: string;
  cardId: string;
}

export interface BattlePartyState {
  characters: BattleCharacterState[];
  enemies: BattleEnemyState[];
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

export type GachaPoolKind = 'character' | 'card';

export interface GachaPullResult {
  pool: GachaPoolKind;
  id: string; // characterId or cardId
  rarity: Rarity;
  isNew: boolean;
}
