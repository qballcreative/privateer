/**
 * Validates game state received from a peer before applying it.
 * Prevents cheating by checking structure, types, and value ranges.
 */

import { GameState, GamePhase, GoodsType, Difficulty, INITIAL_TOKEN_VALUES } from '@/types/game';
import { debugLog } from '@/lib/debugLog';

const VALID_PHASES: GamePhase[] = ['lobby', 'playing', 'roundEnd', 'gameEnd'];
const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
const VALID_GOODS: GoodsType[] = ['rum', 'cannonballs', 'silks', 'silver', 'gold', 'gemstones'];
const VALID_CARD_TYPES = [...VALID_GOODS, 'ships'] as const;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isArrayOf<T>(arr: unknown, check: (item: unknown) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(check);
}

function isCard(v: unknown): v is { id: string; type: string } {
  return isObject(v) && typeof v.id === 'string' && typeof v.type === 'string' && VALID_CARD_TYPES.includes(v.type as any);
}

function isToken(v: unknown): v is { id: string; type: string; value: number } {
  if (!isObject(v)) return false;
  if (typeof v.id !== 'string' || typeof v.type !== 'string' || typeof v.value !== 'number') return false;
  if (!VALID_GOODS.includes(v.type as GoodsType)) return false;
  // Token values should be reasonable (0-10 range based on INITIAL_TOKEN_VALUES)
  if (v.value < 0 || v.value > 10) return false;
  return true;
}

function isBonusToken(v: unknown): v is { id: string; cardsCount: number; value: number } {
  if (!isObject(v)) return false;
  if (typeof v.id !== 'string' || typeof v.value !== 'number') return false;
  if (![3, 4, 5].includes(v.cardsCount as number)) return false;
  if (v.value < 0 || v.value > 10) return false;
  return true;
}

function isPlayer(v: unknown): v is Record<string, unknown> {
  if (!isObject(v)) return false;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return false;
  if (!Array.isArray(v.hand) || !v.hand.every(isCard)) return false;
  if (!Array.isArray(v.ships) || !v.ships.every(isCard)) return false;
  if (!Array.isArray(v.tokens) || !v.tokens.every(isToken)) return false;
  if (!Array.isArray(v.bonusTokens) || !v.bonusTokens.every(isBonusToken)) return false;
  return true;
}

/**
 * Validates incoming peer game state. Returns the state if valid, or null if rejected.
 * Optionally pass established player IDs to prevent identity spoofing.
 */
export function validateGameState(
  raw: unknown,
  expectedPlayerIds?: [string, string]
): Partial<GameState> | null {
  if (!isObject(raw)) {
    debugLog('engine', 'P2P Validation', 'Rejected: not an object');
    return null;
  }

  const state = raw as Record<string, unknown>;

  // Validate phase
  if (state.phase !== undefined && !VALID_PHASES.includes(state.phase as GamePhase)) {
    debugLog('engine', 'P2P Validation', `Rejected: invalid phase "${state.phase}"`);
    return null;
  }

  // Validate difficulty
  if (state.difficulty !== undefined && !VALID_DIFFICULTIES.includes(state.difficulty as Difficulty)) {
    debugLog('engine', 'P2P Validation', `Rejected: invalid difficulty "${state.difficulty}"`);
    return null;
  }

  // Validate players array
  if (state.players !== undefined) {
    if (!Array.isArray(state.players) || state.players.length !== 2) {
      debugLog('engine', 'P2P Validation', 'Rejected: players must be array of length 2');
      return null;
    }
    if (!state.players.every(isPlayer)) {
      debugLog('engine', 'P2P Validation', 'Rejected: invalid player structure');
      return null;
    }
    // Verify player IDs match established connection
    if (expectedPlayerIds) {
      const receivedIds = (state.players as { id: string }[]).map(p => p.id).sort();
      const expectedSorted = [...expectedPlayerIds].sort();
      if (receivedIds[0] !== expectedSorted[0] || receivedIds[1] !== expectedSorted[1]) {
        debugLog('engine', 'P2P Validation', 'Rejected: player IDs do not match established session');
        return null;
      }
    }
  }

  // Validate currentPlayerIndex
  if (state.currentPlayerIndex !== undefined) {
    if (typeof state.currentPlayerIndex !== 'number' || ![0, 1].includes(state.currentPlayerIndex)) {
      debugLog('engine', 'P2P Validation', 'Rejected: invalid currentPlayerIndex');
      return null;
    }
  }

  // Validate roundWins
  if (state.roundWins !== undefined) {
    if (!Array.isArray(state.roundWins) || state.roundWins.length !== 2) {
      debugLog('engine', 'P2P Validation', 'Rejected: roundWins must be array of length 2');
      return null;
    }
    if (!state.roundWins.every((w: unknown) => typeof w === 'number' && Number.isInteger(w) && (w as number) >= 0 && (w as number) <= 3)) {
      debugLog('engine', 'P2P Validation', 'Rejected: roundWins values out of range');
      return null;
    }
  }

  // Validate round / maxRounds / turnCount
  for (const field of ['round', 'maxRounds', 'turnCount'] as const) {
    if (state[field] !== undefined) {
      if (typeof state[field] !== 'number' || (state[field] as number) < 0) {
        debugLog('engine', 'P2P Validation', `Rejected: invalid ${field}`);
        return null;
      }
    }
  }

  // Validate market and deck are arrays of cards
  for (const field of ['market', 'deck'] as const) {
    if (state[field] !== undefined) {
      if (!isArrayOf(state[field], isCard)) {
        debugLog('engine', 'P2P Validation', `Rejected: invalid ${field}`);
        return null;
      }
    }
  }

  // Validate tokenStacks
  if (state.tokenStacks !== undefined) {
    if (!isObject(state.tokenStacks)) {
      debugLog('engine', 'P2P Validation', 'Rejected: invalid tokenStacks');
      return null;
    }
    for (const goodsType of VALID_GOODS) {
      const stack = (state.tokenStacks as Record<string, unknown>)[goodsType];
      if (stack !== undefined && !isArrayOf(stack, isToken)) {
        debugLog('engine', 'P2P Validation', `Rejected: invalid tokenStack for ${goodsType}`);
        return null;
      }
    }
  }

  // Validate bonusTokens
  if (state.bonusTokens !== undefined) {
    if (!isObject(state.bonusTokens)) {
      debugLog('engine', 'P2P Validation', 'Rejected: invalid bonusTokens');
      return null;
    }
    const bt = state.bonusTokens as Record<string, unknown>;
    for (const tier of ['three', 'four', 'five'] as const) {
      if (bt[tier] !== undefined && !isArrayOf(bt[tier], isBonusToken)) {
        debugLog('engine', 'P2P Validation', `Rejected: invalid bonusTokens.${tier}`);
        return null;
      }
    }
  }

  // Strip any unexpected top-level keys
  const allowedKeys = new Set([
    'phase', 'market', 'deck', 'tokenStacks', 'bonusTokens', 'players',
    'currentPlayerIndex', 'round', 'maxRounds', 'roundWins', 'lastAction',
    'difficulty', 'optionalRules', 'turnCount', 'hiddenTreasures', 'isMultiplayer',
  ]);
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(state)) {
    if (allowedKeys.has(key)) {
      sanitized[key] = state[key];
    }
  }

  return sanitized as Partial<GameState>;
}
