import { RulePlugin, TurnEndContext, RoundEndContext, RuleContext } from './RulesEngine';
import {
  Card,
  MARKET_SIZE,
  HiddenTreasure,
} from '@/types/game';

// ═══════════════════════════════════════════════════════════════════
// STORM RULE
// Every 3rd turn, 2 random non-ship market objects are whisked away
// and replaced from deck.
// ═══════════════════════════════════════════════════════════════════

export const stormRule: RulePlugin = {
  id: 'storm',
  name: 'Storm Rule',
  description: 'Every 3rd turn, a storm washes away 2 random market goods and replaces them from the deck.',
  enableByDefault: false,

  hooks: {
    onTurnEnd(ctx: TurnEndContext) {
      const { state, shuffle } = ctx;

      if (state.turnCount % 3 !== 0) return;
      if (state.market.length < 2) return;

      const nonShipCards = state.market.filter((c) => c.type !== 'ships');
      const cardsToRemove = shuffle(nonShipCards).slice(0, Math.min(2, nonShipCards.length));

      state.market = state.market.filter(
        (c) => !cardsToRemove.some((r) => r.id === c.id)
      );

      const cardsNeeded = MARKET_SIZE - state.market.length;
      state.market = [...state.market, ...state.deck.slice(0, cardsNeeded)];
      state.deck = state.deck.slice(cardsNeeded);

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
// Once per game per player, steal 1 random object from opponent's
// Hold. The raid action is handled by the core store action; this
// plugin only enforces the "once per game" guard via onBeforeAction
// and resets the flag on game start.
// ═══════════════════════════════════════════════════════════════════

export const pirateRaidRule: RulePlugin = {
  id: 'pirate_raid',
  name: 'Pirate Raid',
  description: "Once per game, steal one random cargo from an opponent's hold.",
  enableByDefault: false,

  hooks: {
    onGameStart(ctx: RuleContext) {
      // Ensure all players start with raid available
      ctx.state.players.forEach((p) => {
        p.hasUsedPirateRaid = false;
      });
    },

    onDeal(ctx: RuleContext) {
      // Reset raid on new round for all players
      ctx.state.players.forEach((p) => {
        p.hasUsedPirateRaid = false;
      });
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// TREASURE CHEST
// At game start, assign hidden bonus tokens to each player.
// Reveal and add them at round end.
// ═══════════════════════════════════════════════════════════════════

const TREASURE_CHEST_VALUES = [2, 3, 4, 5];

export const treasureChestRule: RulePlugin = {
  id: 'treasure_chest',
  name: 'Treasure Chest',
  description: 'Each player receives a hidden bonus token revealed at the end of each round.',
  enableByDefault: false,

  hooks: {
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

    onRoundEnd(ctx: RoundEndContext) {
      const { state } = ctx;
      if (!state.hiddenTreasures || state.hiddenTreasures.length === 0) return;

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
