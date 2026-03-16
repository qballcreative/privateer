/**
 * Optional Rule Plugins — Privateer: Letters of Marque
 *
 * Each plugin implements the RulePlugin interface and hooks into the
 * RulesEngine lifecycle. Plugins are registered once at app startup and
 * toggled on/off per game session via the settings UI.
 *
 * Plugins:
 *  1. Storm Rule      — Market disruption every 3rd turn
 *  2. Pirate Raid     — One-time card steal from opponent
 *  3. Treasure Chest  — Hidden bonus tokens revealed at round end
 */

import { RulePlugin, TurnEndContext, RoundEndContext, RuleContext } from './RulesEngine';
import {
  Card,
  MARKET_SIZE,
  HiddenTreasure,
} from '@/types/game';

// ═══════════════════════════════════════════════════════════════════
// STORM RULE
// Every 3rd turn, 2 random non-ship market goods are removed and
// replaced from the deck. Adds unpredictability to the market.
// ═══════════════════════════════════════════════════════════════════

export const stormRule: RulePlugin = {
  id: 'storm',
  name: 'Storm Rule',
  description: 'Every 3rd turn, a storm washes away 2 random market goods and replaces them from the deck.',
  enableByDefault: false,

  hooks: {
    /**
     * Fires after each turn ends. On every 3rd turn, randomly removes
     * up to 2 non-ship cards from the market and refills from deck.
     */
    onTurnEnd(ctx: TurnEndContext) {
      const { state, shuffle } = ctx;

      // Only trigger on turns divisible by 3
      if (state.turnCount % 3 !== 0) return;
      if (state.market.length < 2) return;

      // Select up to 2 random non-ship cards to remove
      const nonShipCards = state.market.filter((c) => c.type !== 'ships');
      const cardsToRemove = shuffle(nonShipCards).slice(0, Math.min(2, nonShipCards.length));

      // Remove selected cards from market
      state.market = state.market.filter(
        (c) => !cardsToRemove.some((r) => r.id === c.id)
      );

      // Refill market from deck to maintain MARKET_SIZE
      const cardsNeeded = MARKET_SIZE - state.market.length;
      state.market = [...state.market, ...state.deck.slice(0, cardsNeeded)];
      state.deck = state.deck.slice(cardsNeeded);

      // Inject a storm action notification for the UI
      ctx.injectedAction = {
        type: 'storm',
        playerName: 'Storm',
        description: `washes away ${cardsToRemove.length} cards!`,
        cardsInvolved: cardsToRemove,
      };
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// PIRATE RAID
// Once per game per player, steal 1 card from an opponent's hand.
// The actual steal logic lives in gameStore.pirateRaid(); this plugin
// only manages the "once per game" flag lifecycle.
// ═══════════════════════════════════════════════════════════════════

export const pirateRaidRule: RulePlugin = {
  id: 'pirate_raid',
  name: 'Pirate Raid',
  description: "Once per game, steal one random cargo from an opponent's hold.",
  enableByDefault: false,

  hooks: {
    /** Reset raid availability for all players at the start of a new game. */
    onGameStart(ctx: RuleContext) {
      ctx.state.players.forEach((p) => {
        p.hasUsedPirateRaid = false;
      });
    },

    /** Reset raid availability at the start of each new round. */
    onDeal(ctx: RuleContext) {
      ctx.state.players.forEach((p) => {
        p.hasUsedPirateRaid = false;
      });
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// TREASURE CHEST
// At the start of each round (onDeal), assign a hidden bonus token
// to each player. At round end, reveal and add them to scores.
// Adds an element of surprise to the final scoring.
// ═══════════════════════════════════════════════════════════════════

/** Possible values for hidden treasure tokens. */
const TREASURE_CHEST_VALUES = [2, 3, 4, 5];

export const treasureChestRule: RulePlugin = {
  id: 'treasure_chest',
  name: 'Treasure Chest',
  description: 'Each player receives a hidden bonus token revealed at the end of each round.',
  enableByDefault: false,

  hooks: {
    /**
     * On deal (start of each round), shuffle treasure values and
     * assign one hidden token to each player.
     */
    onDeal(ctx: RuleContext) {
      const { state, shuffle, generateId } = ctx;
      const shuffledValues = shuffle([...TREASURE_CHEST_VALUES]);

      state.hiddenTreasures = state.players.map((player, index) => ({
        playerId: player.id,
        tokens: [
          {
            id: generateId(),
            cardsCount: 3 as const,
            value: shuffledValues[index % shuffledValues.length],
          },
        ],
      }));
    },

    /**
     * At round end, reveal each player's hidden treasure and add the
     * tokens to their bonusTokens collection for final scoring.
     */
    onRoundEnd(ctx: RoundEndContext) {
      const { state } = ctx;
      if (!state.hiddenTreasures || state.hiddenTreasures.length === 0) return;

      // Merge hidden treasure tokens into each player's bonus tokens
      state.hiddenTreasures.forEach((treasure: HiddenTreasure) => {
        const playerIndex = state.players.findIndex(
          (p) => p.id === treasure.playerId
        );
        if (playerIndex !== -1) {
          state.players[playerIndex] = {
            ...state.players[playerIndex],
            bonusTokens: [
              ...state.players[playerIndex].bonusTokens,
              ...treasure.tokens,
            ],
          };
        }
      });
    },
  },
};
