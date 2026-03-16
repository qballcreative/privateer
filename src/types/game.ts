/**
 * Core Game Types — Privateer: Letters of Marque
 *
 * Defines all shared data structures used across the game: cards, tokens,
 * players, game state, and configuration constants. This file is the single
 * source of truth for game data shapes and is imported by stores, components,
 * the rules engine, and the AI module.
 */

// ─── Card & Goods Types ─────────────────────────────────────────────

/** The six tradeable commodity types in the game. */
export type GoodsType = 'rum' | 'cannonballs' | 'silks' | 'silver' | 'gold' | 'gemstones';

/** All card types — the six goods plus ships (which act like camels in Jaipur). */
export type CardType = GoodsType | 'ships';

/** A single card in the deck, market, or a player's hand/fleet. */
export interface Card {
  id: string;
  type: CardType;
}

// ─── Tokens ─────────────────────────────────────────────────────────

/** A doubloon token awarded when a player sells goods of the matching type. */
export interface Token {
  id: string;
  type: GoodsType;
  /** Point value of this token (decreases as the stack is depleted). */
  value: number;
}

/**
 * A bonus commission seal awarded for selling 3, 4, or 5+ cards at once.
 * Values are shuffled at game start so the exact bonus is unknown until earned.
 */
export interface BonusToken {
  id: string;
  /** How many cards must be sold in one action to earn this tier. */
  cardsCount: 3 | 4 | 5;
  value: number;
}

// ─── Player ─────────────────────────────────────────────────────────

/** Represents one player (human or AI) and all their game-state possessions. */
export interface Player {
  id: string;
  name: string;
  /** Goods cards currently in the player's cargo hold (max HAND_LIMIT). */
  hand: Card[];
  /** Ship cards collected — stored separately, don't count toward hand limit. */
  ships: Card[];
  /** Doubloon tokens earned from selling goods. */
  tokens: Token[];
  /** Bonus commission seals earned from multi-card sells. */
  bonusTokens: BonusToken[];
  /** True if this player is controlled by the AI decision engine. */
  isAI?: boolean;
  /** True for the local human player (used to determine perspective in UI). */
  isLocal?: boolean;
  /** For Pirate Raid optional rule — tracks whether this player has used their one-time raid. */
  hasUsedPirateRaid?: boolean;
}

// ─── Action Validation ──────────────────────────────────────────────

/** Result returned by action validators (canTakeOne, canSell, etc.). */
export interface ActionValidation {
  ok: boolean;
  reason?: string;
}

// ─── Optional Rules ─────────────────────────────────────────────────

/** Toggle flags for the three optional rule expansions. */
export interface OptionalRules {
  /** Every 3rd turn, discard 2 random market goods and replace from deck. */
  stormRule: boolean;
  /** Once per game per player, steal one card from opponent's hand. */
  pirateRaid: boolean;
  /** Each player receives a hidden bonus token revealed at round end. */
  treasureChest: boolean;
}

/** Hidden treasure data for the Treasure Chest optional rule. */
export interface HiddenTreasure {
  playerId: string;
  tokens: BonusToken[];
}

// ─── Game State ─────────────────────────────────────────────────────

/** The four phases of the game lifecycle. */
export type GamePhase = 'lobby' | 'playing' | 'roundEnd' | 'gameEnd';

/** Which action the current player is performing this turn. */
export type TurnAction = 'take' | 'exchange' | 'sell' | null;

/** AI difficulty tiers — each maps to a set of weighted heuristics. */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** All possible action types shown in the action notification banner. */
export type ActionType = 'take' | 'take-ships' | 'exchange' | 'sell' | 'raid' | 'storm';

/**
 * Describes an action that was just performed — used by the ActionNotification
 * component and the rules engine to display what happened.
 */
export interface ActionDisplay {
  type: ActionType;
  playerName: string;
  description: string;
  /** Cards directly involved in the action (e.g., the card taken or sold). */
  cardsInvolved?: Card[];
  /** Cards given away in an exchange. */
  cardsGiven?: Card[];
  /** Cards received in an exchange. */
  cardsReceived?: Card[];
  /** Total doubloon value of tokens earned (sell action). */
  tokensEarned?: number;
  /** Bonus seal value earned (sell action with 3+ cards). */
  bonusEarned?: number;
}

/**
 * The complete game state — stored in the Zustand gameStore.
 * This is the single source of truth for the entire game at any point in time.
 */
export interface GameState {
  phase: GamePhase;
  /** The 5-card market where players take/exchange goods. */
  market: Card[];
  /** Remaining draw pile — cards are dealt to refill the market. */
  deck: Card[];
  /** Doubloon token stacks for each goods type (highest value on top). */
  tokenStacks: Record<GoodsType, Token[]>;
  /** Bonus commission seal pools, grouped by required sell count (3/4/5). */
  bonusTokens: {
    three: BonusToken[];
    four: BonusToken[];
    five: BonusToken[];
  };
  /** All players in the game (index 0 = host/local, index 1 = AI or guest). */
  players: Player[];
  /** Index into `players` for whose turn it is. */
  currentPlayerIndex: number;
  /** Current round number (1-indexed). */
  round: number;
  /** Total rounds in the series (e.g. 3 for best-of-3). */
  maxRounds: number;
  /** Per-player round win tallies (parallel to `players`). */
  roundWins: number[];
  /** The most recent action performed — drives the action notification UI. */
  lastAction: ActionDisplay | null;
  /** Current AI difficulty setting. */
  difficulty: Difficulty;
  /** Which optional rules are active for this game. */
  optionalRules: OptionalRules;
  /** Global turn counter across all players (used by storm rule). */
  turnCount: number;
  /** Hidden treasure tokens for the Treasure Chest rule. */
  hiddenTreasures: HiddenTreasure[];
  /** Whether this is a peer-to-peer multiplayer game. */
  isMultiplayer: boolean;
  /** Per-round winner player IDs (null = tie). */
  roundWinners: (string | null)[];
  /** Who goes first: 'host' = player 0 always, 'random' = coin flip. */
  firstPlayer: 'host' | 'random';
}

// ─── Game Constants ─────────────────────────────────────────────────

/**
 * Starting token values for each goods type stack.
 * Values are listed highest-to-lowest (top of stack first).
 * Premium goods (gems, gold, silver) have fewer tokens but higher values.
 * Common goods (silks, cannonballs, rum) have more tokens with lower values.
 */
export const INITIAL_TOKEN_VALUES: Record<GoodsType, number[]> = {
  gemstones: [7, 7, 5, 5, 5],
  gold: [6, 6, 5, 5, 5],
  silver: [5, 5, 5, 5, 5],
  silks: [5, 3, 3, 2, 2, 1, 1],
  cannonballs: [5, 3, 3, 2, 2, 1, 1],
  rum: [4, 3, 2, 1, 1, 1, 1, 1, 1],
};

/** Possible values for 3-card bonus commission seals (shuffled at game start). */
export const BONUS_THREE_VALUES = [1, 1, 2, 2, 2, 3, 3];
/** Possible values for 4-card bonus commission seals. */
export const BONUS_FOUR_VALUES = [4, 4, 5, 5, 6, 6];
/** Possible values for 5+-card bonus commission seals. */
export const BONUS_FIVE_VALUES = [8, 8, 9, 10, 10];

/**
 * How many cards of each type exist in the full deck (55 cards total).
 * Based on the Jaipur card game composition.
 */
export const DECK_COMPOSITION: Record<CardType, number> = {
  gemstones: 6,
  gold: 6,
  silver: 6,
  silks: 8,
  cannonballs: 8,
  rum: 10,
  ships: 11,
};

/** Maximum number of goods cards a player can hold (ships excluded). */
export const HAND_LIMIT = 7;
/** Number of cards displayed in the Trading Post market. */
export const MARKET_SIZE = 5;
/** Minimum cards required to sell premium goods (gold, silver, gemstones). */
export const MIN_SELL_EXPENSIVE = 2;
