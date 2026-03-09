/**
 * AI Player Module — Strategic AI opponent for Privateer: Letters of Marque
 *
 * Extracted from gameStore to keep the store focused on state management.
 * The AI evaluates all legal moves, scores them via weighted heuristics
 * per difficulty tier, then picks the best (with optional randomness).
 */

import {
  Card,
  GoodsType,
  Token,
  BonusToken,
  Player,
  Difficulty,
  OptionalRules,
  HAND_LIMIT,
} from '@/types/game';
import { secureRandom, secureRandomInt } from '@/lib/security';

// ─── Types ───────────────────────────────────────────────────────────

/** Read-only snapshot of the game state the AI needs to evaluate moves. */
export interface AIGameView {
  market: Card[];
  players: Player[];
  currentPlayerIndex: number;
  tokenStacks: Record<GoodsType, Token[]>;
  bonusTokens: { three: BonusToken[]; four: BonusToken[]; five: BonusToken[] };
  difficulty: Difficulty;
  optionalRules: OptionalRules;
}

/** Callbacks into the store to execute the chosen action. */
export interface AIActions {
  takeCard: (cardId: string) => void;
  takeAllShips: () => void;
  sellCards: (cardIds: string[]) => void;
  exchangeCards: (handCardIds: string[], marketCardIds: string[]) => void;
  pirateRaid: (targetCardId: string) => void;
}

interface ScoredAction {
  action: () => void;
  score: number;
  description: string;
}

// ─── Difficulty Weights ──────────────────────────────────────────────

const DIFFICULTY_WEIGHTS = {
  easy:   { blocking: 0,   bonusPursuit: 0.5, sellPatience: 0,   tokenUrgency: 0.3, randomVariance: 0.5 },
  medium: { blocking: 0.3, bonusPursuit: 0.8, sellPatience: 0.5, tokenUrgency: 0.6, randomVariance: 0.25 },
  hard:   { blocking: 0.8, bonusPursuit: 1.2, sellPatience: 1.0, tokenUrgency: 1.0, randomVariance: 0.1 },
  expert: { blocking: 1.0, bonusPursuit: 1.5, sellPatience: 1.2, tokenUrgency: 1.2, randomVariance: 0 },
} as const;

// ─── Evaluation Helpers ──────────────────────────────────────────────

/** How urgently a goods type should be collected/sold. */
const evaluateTokenUrgency = (type: GoodsType, tokenStacks: Record<GoodsType, Token[]>): number => {
  const stack = tokenStacks[type];
  if (stack.length === 0) return 0;
  const remainingValue = stack.slice(0, 3).reduce((sum, t) => sum + t.value, 0);
  const scarcityBonus = Math.max(0, (5 - stack.length) * 2);
  return (remainingValue / 3) + scarcityBonus;
};

/** How much blocking value a card type has across all opponents. */
const evaluateBlockingValue = (type: GoodsType, opponents: Player[]): number => {
  let maxBlock = 0;
  for (const opp of opponents) {
    const oppCount = opp.hand.filter(c => c.type === type).length;
    let block = 0;
    if (oppCount >= 3) block = 8;
    else if (oppCount >= 2) block = 4;
    else if (oppCount >= 1) block = 1;
    maxBlock = Math.max(maxBlock, block);
  }
  return maxBlock;
};

/** Bonus potential for selling X cards. */
const evaluateBonusPotential = (
  cardCount: number,
  bonusTokens: AIGameView['bonusTokens'],
): number => {
  if (cardCount >= 5 && bonusTokens.five.length > 0) return bonusTokens.five[0].value + 4;
  if (cardCount >= 4 && bonusTokens.four.length > 0) return bonusTokens.four[0].value + 2;
  if (cardCount >= 3 && bonusTokens.three.length > 0) return bonusTokens.three[0].value;
  return 0;
};

/** Sell timing penalty/bonus. */
const evaluateSellTiming = (
  type: GoodsType,
  cardCount: number,
  ai: Player,
  market: Card[],
  tokenStacks: Record<GoodsType, Token[]>,
  sellPatience: number,
): number => {
  const aiCardCount = ai.hand.filter(c => c.type === type).length;
  const stack = tokenStacks[type];

  if (stack.length <= cardCount) return 3;

  if (cardCount < 3 && aiCardCount < 4) {
    const marketHas = market.filter(c => c.type === type).length;
    if (marketHas > 0 || stack.length > cardCount + 2) {
      return -4 * sellPatience;
    }
  }

  return 0;
};

/** Value of taking a card of a given type. */
const evaluateTakeValue = (
  type: GoodsType,
  ai: Player,
  opponents: Player[],
  tokenStacks: Record<GoodsType, Token[]>,
  weights: typeof DIFFICULTY_WEIGHTS[Difficulty],
): number => {
  const stack = tokenStacks[type];
  if (stack.length === 0) return -2;

  const aiCount = ai.hand.filter(c => c.type === type).length;
  let score = stack[0].value;

  if (aiCount === 4) score += 10 * weights.bonusPursuit;
  else if (aiCount === 3) score += 6 * weights.bonusPursuit;
  else if (aiCount === 2) score += 4 * weights.bonusPursuit;
  else if (aiCount === 1) score += 2 * weights.bonusPursuit;

  score += evaluateTokenUrgency(type, tokenStacks) * weights.tokenUrgency;
  score += evaluateBlockingValue(type, opponents) * weights.blocking;

  return score;
};

/** Evaluate an exchange opportunity. */
const evaluateExchange = (
  handCardIds: string[],
  marketCardIds: string[],
  ai: Player,
  market: Card[],
  tokenStacks: Record<GoodsType, Token[]>,
  opponents: Player[],
  bonusTokens: AIGameView['bonusTokens'],
  weights: typeof DIFFICULTY_WEIGHTS[Difficulty],
): number => {
  const handCards = ai.hand.filter(c => handCardIds.includes(c.id));
  const handShips = ai.ships.filter(c => handCardIds.includes(c.id));
  const marketCards = market.filter(c => marketCardIds.includes(c.id));

  if (handCards.length + handShips.length !== marketCards.length) return -100;
  if (marketCards.length < 2) return -100;

  const nonShipMarketCards = marketCards.filter(c => c.type !== 'ships').length;
  const newHandSize = ai.hand.length - handCards.length + nonShipMarketCards;
  if (newHandSize > HAND_LIMIT) return -100;

  let givenValue = 0;
  handCards.forEach(c => {
    if (c.type !== 'ships') {
      const type = c.type as GoodsType;
      const stack = tokenStacks[type];
      givenValue += stack.length > 0 ? stack[0].value * 0.5 : 1;
    }
  });
  givenValue += handShips.length * 0.5;

  let gainedValue = 0;
  let bonusOpportunity = 0;

  marketCards.forEach(c => {
    if (c.type !== 'ships') {
      const type = c.type as GoodsType;
      gainedValue += evaluateTakeValue(type, ai, opponents, tokenStacks, weights);

      const aiCount = ai.hand.filter(hc => hc.type === type).length;
      const incomingCount = marketCards.filter(mc => mc.type === type).length;
      const futureCount = aiCount + incomingCount - handCards.filter(hc => hc.type === type).length;
      bonusOpportunity += evaluateBonusPotential(futureCount, bonusTokens);
    }
  });

  return gainedValue - givenValue + (bonusOpportunity * weights.bonusPursuit);
};

// ─── Main AI Decision Function ───────────────────────────────────────

/**
 * Decides and executes the best action for the current AI player.
 * Reads the game view (immutable snapshot) and calls exactly one action.
 */
export function computeAIMove(view: AIGameView, actions: AIActions): void {
  const { market, players, currentPlayerIndex, tokenStacks, bonusTokens, difficulty, optionalRules } = view;
  const ai = players[currentPlayerIndex];
  if (!ai.isAI) return;

  const opponents = players.filter((_, i) => i !== currentPlayerIndex);
  const weights = DIFFICULTY_WEIGHTS[difficulty];

  const scored: ScoredAction[] = [];

  // --- PIRATE RAID ---
  if (optionalRules.pirateRaid && !ai.hasUsedPirateRaid && ai.hand.length < HAND_LIMIT) {
    for (const opp of opponents) {
      opp.hand.forEach((card) => {
        if (card.type === 'ships') return;

        const type = card.type as GoodsType;
        let score = evaluateTakeValue(type, ai, opponents, tokenStacks, weights);

        const oppCount = opp.hand.filter(c => c.type === type).length;
        if (oppCount >= 3) score += 10 * weights.blocking;

        const aiCount = ai.hand.filter(c => c.type === type).length;
        if (aiCount >= 3) score += 8;

        scored.push({
          action: () => actions.pirateRaid(card.id),
          score: score + 5,
          description: `raid ${type} from ${opp.name}`,
        });
      });
    }
  }

  // --- TAKE SINGLE CARD ---
  market.forEach((card) => {
    if (card.type === 'ships') return;
    if (ai.hand.length >= HAND_LIMIT) return;

    const type = card.type as GoodsType;
    const score = evaluateTakeValue(type, ai, opponents, tokenStacks, weights);

    scored.push({
      action: () => actions.takeCard(card.id),
      score,
      description: `take ${type}`,
    });
  });

  // --- TAKE ALL SHIPS ---
  const ships = market.filter((c) => c.type === 'ships');
  if (ships.length > 0) {
    let score = ships.length * 2;
    if (ai.hand.length >= 5) score += 3;
    if (ai.ships.length >= 5) score -= 2;

    scored.push({
      action: () => actions.takeAllShips(),
      score,
      description: `take ${ships.length} ships`,
    });
  }

  // --- SELL CARDS ---
  const cardsByType: Record<string, Card[]> = {};
  ai.hand.forEach((card) => {
    if (!cardsByType[card.type]) cardsByType[card.type] = [];
    cardsByType[card.type].push(card);
  });

  Object.entries(cardsByType).forEach(([type, cards]) => {
    const goodsType = type as GoodsType;
    const expensive = ['gold', 'silver', 'gemstones'];
    const minCards = expensive.includes(type) ? 2 : 1;

    if (cards.length >= minCards) {
      const stack = tokenStacks[goodsType];

      let score = 0;
      for (let i = 0; i < Math.min(cards.length, stack.length); i++) {
        score += stack[i].value;
      }

      score += evaluateBonusPotential(cards.length, bonusTokens);
      score += evaluateSellTiming(goodsType, cards.length, ai, market, tokenStacks, weights.sellPatience);

      if (stack.length <= cards.length + 1) {
        score += 5 * weights.tokenUrgency;
      }

      scored.push({
        action: () => actions.sellCards(cards.map((c) => c.id)),
        score,
        description: `sell ${cards.length} ${type}`,
      });
    }
  });

  // --- EXCHANGE CARDS ---
  if (difficulty !== 'easy' || ai.ships.length >= 2) {
    const goodsInMarket = market.filter(c => c.type !== 'ships');

    if (goodsInMarket.length >= 2) {
      const valuableMarket = goodsInMarket
        .filter(c => {
          const type = c.type as GoodsType;
          return evaluateTakeValue(type, ai, opponents, tokenStacks, weights) >= 4;
        })
        .slice(0, 3);

      if (valuableMarket.length >= 2) {
        const expendable: Card[] = [];
        expendable.push(...ai.ships.slice(0, 2));

        Object.entries(cardsByType).forEach(([type, cards]) => {
          if (cards.length === 1) {
            const stack = tokenStacks[type as GoodsType];
            if (stack.length > 0 && stack[0].value <= 3) {
              expendable.push(cards[0]);
            }
          }
        });

        // Filter out same-type swaps
        const marketTypesSet = new Set(valuableMarket.map(c => c.type));
        const validExpendable = expendable.filter(c => !marketTypesSet.has(c.type));

        if (validExpendable.length >= 2) {
          const numToTrade = Math.min(validExpendable.length, valuableMarket.length, 3);

          const handToGive = validExpendable.slice(0, numToTrade).map(c => c.id);
          const marketToTake = valuableMarket.slice(0, numToTrade).map(c => c.id);

          const exchangeScore = evaluateExchange(
            handToGive, marketToTake, ai, market, tokenStacks, opponents, bonusTokens, weights,
          );

          if (exchangeScore > 0) {
            scored.push({
              action: () => actions.exchangeCards(handToGive, marketToTake),
              score: exchangeScore,
              description: `exchange ${numToTrade} cards`,
            });
          }
        }
      }
    }
  }

  // ─── SELECT ACTION ─────────────────────────────────────────────
  if (scored.length === 0) return;

  scored.sort((a, b) => b.score - a.score);

  let chosenIndex = 0;

  if (weights.randomVariance > 0) {
    const random = secureRandom();
    if (random < weights.randomVariance) {
      const topN = Math.min(3, scored.length);
      chosenIndex = secureRandomInt(topN);
    }
  }

  scored[chosenIndex].action();
}
