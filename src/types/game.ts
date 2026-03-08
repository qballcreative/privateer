export type GoodsType = 'rum' | 'cannonballs' | 'silks' | 'silver' | 'gold' | 'gemstones';
export type CardType = GoodsType | 'ships';

export interface Card {
  id: string;
  type: CardType;
}

export interface Token {
  id: string;
  type: GoodsType;
  value: number;
}

export interface BonusToken {
  id: string;
  cardsCount: 3 | 4 | 5;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  ships: Card[]; // Ships (camels equivalent) collected
  tokens: Token[];
  bonusTokens: BonusToken[];
  isAI?: boolean;
  isLocal?: boolean; // True for the local human player
  hasUsedPirateRaid?: boolean; // For Pirate Raid rule - once per game
}

/** Result of an action validator. */
export interface ActionValidation {
  ok: boolean;
  reason?: string;
}

export interface OptionalRules {
  stormRule: boolean; // Discard 2 random market cards every 3rd turn
  pirateRaid: boolean; // Steal one card from opponent once per game
  treasureChest: boolean; // Hidden bonus tokens revealed at end
}

export interface HiddenTreasure {
  playerId: string;
  tokens: BonusToken[];
}

export type GamePhase = 'lobby' | 'playing' | 'roundEnd' | 'gameEnd';
export type TurnAction = 'take' | 'exchange' | 'sell' | null;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type ActionType = 'take' | 'take-ships' | 'exchange' | 'sell' | 'raid' | 'storm';

export interface ActionDisplay {
  type: ActionType;
  playerName: string;
  description: string;
  cardsInvolved?: Card[];
  cardsGiven?: Card[];
  cardsReceived?: Card[];
  tokensEarned?: number;
  bonusEarned?: number;
}

export interface GameState {
  phase: GamePhase;
  market: Card[];
  deck: Card[];
  tokenStacks: Record<GoodsType, Token[]>;
  bonusTokens: {
    three: BonusToken[];
    four: BonusToken[];
    five: BonusToken[];
  };
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  maxRounds: number;
  roundWins: number[];
  lastAction: ActionDisplay | null;
  difficulty: Difficulty;
  optionalRules: OptionalRules;
  turnCount: number; // For storm rule
  hiddenTreasures: HiddenTreasure[]; // For treasure chest rule
  isMultiplayer: boolean; // For multiplayer mode
  roundWinners: (string | null)[]; // Per-round winner player IDs
}

// Token values based on Jaipur rules
export const INITIAL_TOKEN_VALUES: Record<GoodsType, number[]> = {
  gemstones: [7, 7, 5, 5, 5],
  gold: [6, 6, 5, 5, 5],
  silver: [5, 5, 5, 5, 5],
  silks: [5, 3, 3, 2, 2, 1, 1],
  cannonballs: [5, 3, 3, 2, 2, 1, 1],
  rum: [4, 3, 2, 1, 1, 1, 1, 1, 1],
};

// Bonus token values (shuffled in game)
export const BONUS_THREE_VALUES = [1, 1, 2, 2, 2, 3, 3];
export const BONUS_FOUR_VALUES = [4, 4, 5, 5, 6, 6];
export const BONUS_FIVE_VALUES = [8, 8, 9, 10, 10];

// Deck composition (same as Jaipur)
export const DECK_COMPOSITION: Record<CardType, number> = {
  gemstones: 6,
  gold: 6,
  silver: 6,
  silks: 8,
  cannonballs: 8,
  rum: 10,
  ships: 11,
};

export const HAND_LIMIT = 7;
export const MARKET_SIZE = 5;
export const MIN_SELL_EXPENSIVE = 2; // Minimum cards to sell gold/silver/gemstones
