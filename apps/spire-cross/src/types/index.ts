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
  /** 旅人(プレイヤー作成キャラ)にのみ設定される役職。役職別スキルツリーの判定に使う */
  travelerRole?: PlayerRole;
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

export type MaterialType = 'enhance' | 'evolve' | 'unlock' | 'memory';

export type DungeonCategory = 'enhance' | 'evolve' | 'unlock' | 'memory' | 'raid' | 'event';

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
  chapterTitle: string;
  order: number;
  title: string;
  /** ステージ一覧カードに出す短い要約 */
  flavorText: string;
  /** 戦闘前に読む、小説からそのまま抜粋した本文(段落は\n\nで区切る) */
  narrativeIntro: string;
  /** 戦闘後(勝利時)に読む、その先の展開の抜粋 */
  narrativeOutro: string;
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

/** 旅人(プレイヤーキャラ)の役職。境界に対してどう関わるかで4種に分かれる。 */
export type PlayerRole = 'pierce' | 'guard' | 'weave' | 'shadow';

export interface TravelerBuild {
  name: string;
  role: PlayerRole;
  /** ポイント振り分け結果(素点。実ステータスへの反映は game/travelerBuild.ts で計算) */
  allocatedPoints: { hp: number; atk: number; def: number };
}

export interface CharacterProgress {
  level: number;
  exp: number;
  skillPoints: number;
  allocatedNodeIds: string[];
  /** 記憶のかけらを集め、失った大切な人の記憶と向き合って解放される覚醒フラグ */
  awakened: boolean;
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
  playerRank: number;
  playerExp: number;
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
  /** プレイヤー自身が作成する主人公(旅人)。未作成の場合はnull */
  traveler: TravelerBuild | null;
  /** 序章(クロノス戦チュートリアル〜目覚め)を見終えたか。falseの間はホーム等より先にオープニングを表示する */
  introCompleted: boolean;
  /** ホーム画面の「草原でレベリングしよう」誘導バナーを閉じたか */
  seenHomeGuidance: boolean;
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
  awakened: boolean;
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
