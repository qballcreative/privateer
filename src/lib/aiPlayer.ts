/**
 * AI Player Module — Strategic AI opponent for Privateer: Letters of Marque
 *
 * Evaluates all legal moves, scores them via weighted heuristics
 * per difficulty tier, then picks the best (with optional randomness).
 *
 * Hard/Expert tiers add:
 *  - Score-aware decision making (accelerate when ahead, stall when behind)
 *  - Endgame acceleration / stalling
 *  - Opponent-aware lookahead (expert: full opponent modeling)
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
import { getScoreBreakdown } from '@/lib/scoring';

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
  /** Which goods type stacks this action would deplete (for endgame calc) */
  depletesStack?: GoodsType;
  /** Number of tokens removed from a stack */
  tokensConsumed?: number;
}

// ─── Difficulty Weights ──────────────────────────────────────────────

interface DifficultyWeights {
  blocking: number;
  bonusPursuit: number;
  sellPatience: number;
  tokenUrgency: number;
  randomVariance: number;
  endgameAwareness: number;
  opponentModeling: number;
  raidTiming: number;
}

const DIFFICULTY_WEIGHTS: Record<Difficulty, DifficultyWeights> = {
  easy:   { blocking: 0,   bonusPursuit: 0.5, sellPatience: 0,   tokenUrgency: 0.3, randomVariance: 0.5,  endgameAwareness: 0,   opponentModeling: 0,   raidTiming: 0   },
  medium: { blocking: 0.3, bonusPursuit: 0.8, sellPatience: 0.5, tokenUrgency: 0.6, randomVariance: 0.25, endgameAwareness: 0,   opponentModeling: 0,   raidTiming: 0.5 },
  hard:   { blocking: 0.8, bonusPursuit: 1.2, sellPatience: 1.0, tokenUrgency: 1.0, randomVariance: 0.1,  endgameAwareness: 0.8, opponentModeling: 0.5, raidTiming: 1.0 },
  expert: { blocking: 1.0, bonusPursuit: 1.5, sellPatience: 1.2, tokenUrgency: 1.2, randomVariance: 0,    endgameAwareness: 1.5, opponentModeling: 1.0, raidTiming: 1.0 },
};

// ─── Score Position & Endgame Helpers ────────────────────────────────

/**
 * Returns a factor from -1 (far behind) to +1 (far ahead) indicating
 * how the AI's score compares to the best opponent.
 */
const evaluateScorePosition = (ai: Player, opponents: Player[], allPlayers: Player[]): number => {
  const aiScore = getScoreBreakdown(ai, allPlayers).total;
  const bestOppScore = Math.max(...opponents.map(o => getScoreBreakdown(o, allPlayers).total));

  if (aiScore === 0 && bestOppScore === 0) return 0;

  const diff = aiScore - bestOppScore;
  const maxPossible = Math.max(aiScore + bestOppScore, 1);
  return Math.max(-1, Math.min(1, diff / maxPossible));
};

/**
 * Count how many token stacks are empty or near-empty.
 */
const countDepletedStacks = (tokenStacks: Record<GoodsType, Token[]>): number => {
  return Object.values(tokenStacks).filter(s => s.length === 0).length;
};

/**
 * Endgame modifier: positive when ahead and action accelerates game end,
 * negative when behind and action accelerates game end.
 */
const evaluateEndgameModifier = (
  scorePosition: number,
  depletesStack: GoodsType | undefined,
  tokensConsumed: number,
  tokenStacks: Record<GoodsType, Token[]>,
  weights: DifficultyWeights,
): number => {
  if (weights.endgameAwareness === 0) return 0;
  if (!depletesStack) return 0;

  const stack = tokenStacks[depletesStack];
  const wouldEmpty = stack.length <= tokensConsumed;
  const nearEmpty = stack.length <= tokensConsumed + 1;
  const currentDepleted = countDepletedStacks(tokenStacks);

  let modifier = 0;

  if (scorePosition > 0.1) {
    // AI is ahead — accelerate game end
    if (wouldEmpty) {
      modifier += 8;
      // Extra urgency if this would be the 3rd empty stack (game ends!)
      if (currentDepleted >= 2) modifier += 12;
    } else if (nearEmpty) {
      modifier += 4;
    }
  } else if (scorePosition < -0.1) {
    // AI is behind — avoid ending the game
    if (wouldEmpty) {
      modifier -= 6;
      if (currentDepleted >= 2) modifier -= 10;
    } else if (nearEmpty) {
      modifier -= 3;
    }
    // When behind, boost bonus pursuit to catch up
    modifier += 3; // general bonus for high-value plays
  }

  return modifier * weights.endgameAwareness;
};

/**
 * When behind, add bonus for holding out for larger sells (bigger bonuses).
 * When ahead, reduce penalty for small sells.
 */
const evaluateScoreAwareSellAdjustment = (
  scorePosition: number,
  cardCount: number,
  weights: DifficultyWeights,
): number => {
  if (weights.endgameAwareness === 0) return 0;

  if (scorePosition < -0.1) {
    // Behind: heavily prefer big sells for bonus tokens
    if (cardCount >= 5) return 6 * weights.endgameAwareness;
    if (cardCount >= 4) return 3 * weights.endgameAwareness;
    if (cardCount <= 2) return -4 * weights.endgameAwareness; // don't waste small sells
  } else if (scorePosition > 0.1) {
    // Ahead: small sells are fine if they deplete stacks
    if (cardCount <= 2) return 2 * weights.endgameAwareness;
  }

  return 0;
};

// ─── Opponent Modeling ───────────────────────────────────────────────

interface OpponentThreat {
  type: GoodsType;
  count: number;
  urgency: number; // how close to a big sell
}

/**
 * Identify what opponents are collecting and how threatening their sets are.
 */
const evaluateOpponentThreats = (
  opponents: Player[],
  tokenStacks: Record<GoodsType, Token[]>,
  weights: DifficultyWeights,
): OpponentThreat[] => {
  if (weights.opponentModeling === 0) return [];

  const threats: OpponentThreat[] = [];

  for (const opp of opponents) {
    const typeCounts: Partial<Record<GoodsType, number>> = {};
    opp.hand.forEach(c => {
      if (c.type !== 'ships') {
        const t = c.type as GoodsType;
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }
    });

    for (const [type, count] of Object.entries(typeCounts)) {
      const goodsType = type as GoodsType;
      if (count >= 2 && tokenStacks[goodsType].length > 0) {
        let urgency = 0;
        if (count >= 4) urgency = 10; // about to do a 5-card sell
        else if (count >= 3) urgency = 6; // about to do a 4-card sell
        else if (count >= 2) urgency = 2; // building a set

        threats.push({ type: goodsType, count, urgency });
      }
    }
  }

  return threats.sort((a, b) => b.urgency - a.urgency);
};

/**
 * Blocking modifier: how much taking/raiding a card of this type
 * denies an opponent's strategy.
 */
const evaluateOpponentDenial = (
  type: GoodsType,
  threats: OpponentThreat[],
  weights: DifficultyWeights,
): number => {
  if (weights.opponentModeling === 0) return 0;

  const threat = threats.find(t => t.type === type);
  if (!threat) return 0;

  return threat.urgency * weights.opponentModeling;
};

/**
 * For expert: evaluate whether to save pirate raid for a high-impact moment.
 */
const evaluateRaidTiming = (
  threats: OpponentThreat[],
  weights: DifficultyWeights,
): number => {
  if (weights.raidTiming === 0) return 0;

  // If an opponent has a big set (4+), raid is very valuable now
  const maxThreat = threats.length > 0 ? threats[0].urgency : 0;

  if (maxThreat >= 10) return 8 * weights.raidTiming; // opponent near 5-card sell — raid now!
  if (maxThreat >= 6) return 4 * weights.raidTiming;  // opponent near 4-card sell

  // No big threat — at expert, save the raid for later
  return -3 * weights.raidTiming;
};

// ─── Base Evaluation Helpers ─────────────────────────────────────────

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
  weights: DifficultyWeights,
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
  weights: DifficultyWeights,
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

  // ─── Strategic context (hard/expert only) ──────────────────────
  const scorePosition = weights.endgameAwareness > 0
    ? evaluateScorePosition(ai, opponents, players)
    : 0;

  const opponentThreats = evaluateOpponentThreats(opponents, tokenStacks, weights);

  const scored: ScoredAction[] = [];

  // --- PIRATE RAID ---
  if (optionalRules.pirateRaid && !ai.hasUsedPirateRaid && ai.hand.length < HAND_LIMIT) {
    // Evaluate raid timing — should we use it now or save it?
    const raidTimingBonus = evaluateRaidTiming(opponentThreats, weights);

    for (const opp of opponents) {
      opp.hand.forEach((card) => {
        if (card.type === 'ships') return;

        const type = card.type as GoodsType;
        let score = evaluateTakeValue(type, ai, opponents, tokenStacks, weights);

        const oppCount = opp.hand.filter(c => c.type === type).length;
        if (oppCount >= 3) score += 10 * weights.blocking;

        const aiCount = ai.hand.filter(c => c.type === type).length;
        if (aiCount >= 3) score += 8;

        // Opponent denial bonus
        score += evaluateOpponentDenial(type, opponentThreats, weights);

        // Raid timing: positive = good time to raid, negative = save it
        score += raidTimingBonus;

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
    let score = evaluateTakeValue(type, ai, opponents, tokenStacks, weights);

    // Opponent denial: taking this card denies opponents
    score += evaluateOpponentDenial(type, opponentThreats, weights);

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

    // When ahead, taking ships thins the deck (accelerates game end)
    if (scorePosition > 0.1 && weights.endgameAwareness > 0) {
      score += ships.length * 2 * weights.endgameAwareness;
    }

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

      // Score-aware sell adjustment
      score += evaluateScoreAwareSellAdjustment(scorePosition, cards.length, weights);

      scored.push({
        action: () => actions.sellCards(cards.map((c) => c.id)),
        score,
        description: `sell ${cards.length} ${type}`,
        depletesStack: goodsType,
        tokensConsumed: Math.min(cards.length, stack.length),
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

  // ─── APPLY ENDGAME MODIFIERS ──────────────────────────────────
  if (weights.endgameAwareness > 0) {
    for (const sa of scored) {
      sa.score += evaluateEndgameModifier(
        scorePosition,
        sa.depletesStack,
        sa.tokensConsumed || 0,
        tokenStacks,
        weights,
      );
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
