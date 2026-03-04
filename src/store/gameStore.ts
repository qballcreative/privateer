import { create } from 'zustand';
import {
  GameState,
  Card,
  CardType,
  GoodsType,
  Token,
  BonusToken,
  Player,
  Difficulty,
  OptionalRules,
  HiddenTreasure,
  ActionDisplay,
  INITIAL_TOKEN_VALUES,
  BONUS_THREE_VALUES,
  BONUS_FOUR_VALUES,
  BONUS_FIVE_VALUES,
  DECK_COMPOSITION,
  HAND_LIMIT,
  MARKET_SIZE,
  MIN_SELL_EXPENSIVE,
} from '@/types/game';
import { generateSecureId, secureShuffle, secureRandomInt, secureRandom } from '@/lib/security';
import {
  RulesEngine,
  RuleContext,
  TurnEndContext,
  RoundEndContext,
  stormRule,
  pirateRaidRule,
  treasureChestRule,
} from '@/rules';

// ─── Rules Engine singleton ─────────────────────────────────────────
const rulesEngine = new RulesEngine();
rulesEngine.register(stormRule);
rulesEngine.register(pirateRaidRule);
rulesEngine.register(treasureChestRule);

/** Maps the legacy OptionalRules booleans to engine plugin ids. */
const syncEngineRules = (rules: OptionalRules) => {
  const ids: string[] = [];
  if (rules.stormRule) ids.push('storm');
  if (rules.pirateRaid) ids.push('pirate_raid');
  if (rules.treasureChest) ids.push('treasure_chest');
  rulesEngine.setEnabled(ids);
};

/** Build a RuleContext from the current store state (mutable snapshot). */
const buildCtx = (state: GameState): RuleContext => ({
  state,
  currentPlayerIndex: state.currentPlayerIndex,
  currentPlayer: state.players[state.currentPlayerIndex],
  opponent: state.players[state.currentPlayerIndex === 0 ? 1 : 0],
  pushAction: (action) => { state.lastAction = action; },
  shuffle: secureShuffle,
  generateId: generateSecureId,
});

// Pirate names for AI opponent
const PIRATE_NAMES = [
  "Blackbeard the Bold",
  "Captain Crimson",
  "Salty Pete",
  "One-Eyed Jack",
  "Stormy Sally",
  "Red Rackham",
  "Barnacle Bill",
  "Dread Pirate Roberts",
  "Captain Hook",
  "Long John Silver",
  "Anne Bonny",
  "Calico Jack",
  "Mad Dog Morgan",
  "Ironbeard",
  "The Sea Serpent",
  "Captain Cutlass",
  "Jolly Roger",
  "Scurvy Sam",
  "Treasure Tom",
  "Davey Jones",
];

const getRandomPirateName = () => PIRATE_NAMES[secureRandomInt(PIRATE_NAMES.length)];

// Utility functions - using cryptographically secure randomness
const generateId = generateSecureId;
const shuffle = secureShuffle;

const createDeck = (): Card[] => {
  const cards: Card[] = [];
  (Object.keys(DECK_COMPOSITION) as CardType[]).forEach((type) => {
    for (let i = 0; i < DECK_COMPOSITION[type]; i++) {
      cards.push({ id: generateId(), type });
    }
  });
  return shuffle(cards);
};

const createTokenStacks = (): Record<GoodsType, Token[]> => {
  const stacks: Record<GoodsType, Token[]> = {} as Record<GoodsType, Token[]>;
  (Object.keys(INITIAL_TOKEN_VALUES) as GoodsType[]).forEach((type) => {
    stacks[type] = INITIAL_TOKEN_VALUES[type].map((value) => ({
      id: generateId(),
      type,
      value,
    }));
  });
  return stacks;
};

const createBonusTokens = () => ({
  three: shuffle(BONUS_THREE_VALUES).map((value) => ({
    id: generateId(),
    cardsCount: 3 as const,
    value,
  })),
  four: shuffle(BONUS_FOUR_VALUES).map((value) => ({
    id: generateId(),
    cardsCount: 4 as const,
    value,
  })),
  five: shuffle(BONUS_FIVE_VALUES).map((value) => ({
    id: generateId(),
    cardsCount: 5 as const,
    value,
  })),
});

// Hidden treasure tokens for Treasure Chest rule
const TREASURE_CHEST_VALUES = [2, 3, 4, 5];

const createHiddenTreasures = (playerIds: string[]): HiddenTreasure[] => {
  const shuffledValues = shuffle(TREASURE_CHEST_VALUES);
  return playerIds.map((playerId, index) => ({
    playerId,
    tokens: [{
      id: generateId(),
      cardsCount: 3 as const,
      value: shuffledValues[index % shuffledValues.length],
    }],
  }));
};

const createPlayer = (id: string, name: string, isAI = false): Player => ({
  id,
  name,
  hand: [],
  ships: [],
  tokens: [],
  bonusTokens: [],
  isAI,
  hasUsedPirateRaid: false,
});

export const calculateScore = (player: Player): number => {
  const tokenScore = player.tokens.reduce((sum, t) => sum + t.value, 0);
  const bonusScore = player.bonusTokens.reduce((sum, t) => sum + t.value, 0);
  const shipBonus = player.ships.length >= 1 ? 5 : 0;
  return tokenScore + bonusScore + shipBonus;
};

const defaultOptionalRules: OptionalRules = {
  stormRule: false,
  pirateRaid: false,
  treasureChest: false,
};

interface GameStore extends GameState {
  // Actions
  startGame: (playerName: string, difficulty: Difficulty, optionalRules?: OptionalRules) => void;
  startMultiplayerGame: (playerName: string, opponentName: string, optionalRules: OptionalRules, isHost: boolean) => void;
  applyGameState: (state: Partial<GameState>, swapPlayers?: boolean) => void;
  getSerializableState: () => Partial<GameState>;
  takeCard: (cardId: string) => void;
  takeAllShips: () => void;
  exchangeCards: (handCardIds: string[], marketCardIds: string[]) => void;
  sellCards: (cardIds: string[]) => void;
  pirateRaid: (targetCardId: string) => void;
  endTurn: () => void;
  nextRound: () => void;
  resetGame: () => void;
  
  // AI
  makeAIMove: () => void;
  
  // Computed
  canTakeCard: (cardId: string) => boolean;
  canSellCards: (cardIds: string[]) => boolean;
  canExchange: (handCardIds: string[], marketCardIds: string[]) => boolean;
  canUsePirateRaid: () => boolean;
  getCurrentPlayer: () => Player;
  getOpponent: () => Player;
  isGameOver: () => boolean;
  isRoundOver: () => boolean;
  getWinner: () => Player | null;
  getRoundWinner: () => Player | null;
  getRevealedTreasures: () => HiddenTreasure[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'lobby',
  market: [],
  deck: [],
  tokenStacks: createTokenStacks(),
  bonusTokens: createBonusTokens(),
  players: [createPlayer('1', 'Player'), createPlayer('2', getRandomPirateName(), true)],
  currentPlayerIndex: 0,
  round: 1,
  maxRounds: 3,
  roundWins: [0, 0],
  lastAction: null,
  difficulty: 'medium',
  optionalRules: defaultOptionalRules,
  turnCount: 0,
  hiddenTreasures: [],
  isMultiplayer: false,

  startGame: (playerName, difficulty, optionalRules = defaultOptionalRules) => {
    const deck = createDeck();
    const market: Card[] = [];
    const players: [Player, Player] = [
      createPlayer('1', playerName),
      createPlayer('2', getRandomPirateName(), true),
    ];

    // Deal initial market (3 ships + 2 from deck)
    let shipCount = 0;
    const remainingDeck: Card[] = [];
    
    for (const card of deck) {
      if (shipCount < 3 && card.type === 'ships') {
        market.push(card);
        shipCount++;
      } else {
        remainingDeck.push(card);
      }
    }
    
    // Add 2 more cards to market
    market.push(...remainingDeck.splice(0, 2));

    // Deal 5 cards to each player
    for (let i = 0; i < 5; i++) {
      const card1 = remainingDeck.shift();
      const card2 = remainingDeck.shift();
      if (card1) {
        if (card1.type === 'ships') {
          players[0].ships.push(card1);
        } else {
          players[0].hand.push(card1);
        }
      }
      if (card2) {
        if (card2.type === 'ships') {
          players[1].ships.push(card2);
        } else {
          players[1].hand.push(card2);
        }
      }
    }

    // Sync rules engine
    syncEngineRules(optionalRules);

    const initialState: GameState = {
      phase: 'playing',
      deck: remainingDeck,
      market,
      players,
      tokenStacks: createTokenStacks(),
      bonusTokens: createBonusTokens(),
      currentPlayerIndex: 0,
      round: 1,
      maxRounds: 3,
      roundWins: [0, 0],
      lastAction: null,
      difficulty,
      optionalRules,
      turnCount: 0,
      hiddenTreasures: [],
      isMultiplayer: false,
    };

    // Fire engine hooks
    const ctx = buildCtx(initialState);
    rulesEngine.fireGameStart(ctx);
    rulesEngine.fireDeal(ctx);

    set(initialState);
  },

  startMultiplayerGame: (playerName, opponentName, optionalRules, isHost) => {
    // Only the host generates the game state
    if (!isHost) {
      // Guest waits for state from host
      return;
    }

    const deck = createDeck();
    const market: Card[] = [];
    
    // Host is player 0, guest is player 1
    const hostPlayer = createPlayer('1', playerName, false);
    const guestPlayer = createPlayer('2', opponentName, false);
    const players: [Player, Player] = [hostPlayer, guestPlayer];

    // Deal initial market (3 ships + 2 from deck)
    let shipCount = 0;
    const remainingDeck: Card[] = [];
    
    for (const card of deck) {
      if (shipCount < 3 && card.type === 'ships') {
        market.push(card);
        shipCount++;
      } else {
        remainingDeck.push(card);
      }
    }
    market.push(...remainingDeck.splice(0, 2));

    // Deal 5 cards to each player
    for (let i = 0; i < 5; i++) {
      const card1 = remainingDeck.shift();
      const card2 = remainingDeck.shift();
      if (card1) {
        if (card1.type === 'ships') players[0].ships.push(card1);
        else players[0].hand.push(card1);
      }
      if (card2) {
        if (card2.type === 'ships') players[1].ships.push(card2);
        else players[1].hand.push(card2);
      }
    }

    syncEngineRules(optionalRules);

    const initialState: GameState = {
      phase: 'playing',
      deck: remainingDeck,
      market,
      players,
      tokenStacks: createTokenStacks(),
      bonusTokens: createBonusTokens(),
      currentPlayerIndex: 0,
      round: 1,
      maxRounds: 3,
      roundWins: [0, 0],
      lastAction: null,
      difficulty: 'medium',
      optionalRules,
      turnCount: 0,
      hiddenTreasures: [],
      isMultiplayer: true,
    };

    const ctx = buildCtx(initialState);
    rulesEngine.fireGameStart(ctx);
    rulesEngine.fireDeal(ctx);

    set(initialState);
  },

  // Apply game state received from network (for multiplayer sync)
  applyGameState: (state, swapPlayers = false) => {
    if (swapPlayers && state.players) {
      // Swap player order for guest's perspective
      const [player1, player2] = state.players;
      state.players = [player2, player1];
      // Invert current player index for guest
      if (state.currentPlayerIndex !== undefined) {
        state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
      }
      // Swap round wins too
      if (state.roundWins) {
        state.roundWins = [state.roundWins[1], state.roundWins[0]];
      }
    }
    set(state as GameState);
  },

  // Get serializable state to send over network
  getSerializableState: () => {
    const state = get();
    return {
      phase: state.phase,
      market: state.market,
      deck: state.deck,
      tokenStacks: state.tokenStacks,
      bonusTokens: state.bonusTokens,
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      round: state.round,
      roundWins: state.roundWins,
      lastAction: state.lastAction,
      optionalRules: state.optionalRules,
      turnCount: state.turnCount,
      hiddenTreasures: state.hiddenTreasures,
      isMultiplayer: state.isMultiplayer,
    };
  },

  takeCard: (cardId) => {
    const { market, deck, players, currentPlayerIndex } = get();
    const cardIndex = market.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const card = market[cardIndex];
    const player = players[currentPlayerIndex];

    // Check if it's a ship
    if (card.type === 'ships') {
      player.ships.push(card);
    } else {
      if (player.hand.length >= HAND_LIMIT) return;
      player.hand.push(card);
    }

    // Remove from market and refill
    const newMarket = market.filter((c) => c.id !== cardId);
    if (deck.length > 0) {
      newMarket.push(deck[0]);
    }

    const newPlayers = [...players] as [Player, Player];
    newPlayers[currentPlayerIndex] = { ...player };

    set({
      market: newMarket,
      deck: deck.slice(1),
      players: newPlayers,
      lastAction: {
        type: card.type === 'ships' ? 'take-ships' : 'take',
        playerName: player.name,
        description: `took a ${card.type}`,
        cardsInvolved: [card],
      },
    });

    get().endTurn();
  },

  takeAllShips: () => {
    const { market, deck, players, currentPlayerIndex } = get();
    const ships = market.filter((c) => c.type === 'ships');
    if (ships.length === 0) return;

    const player = players[currentPlayerIndex];
    player.ships.push(...ships);

    // Remove ships and refill market
    let newMarket = market.filter((c) => c.type !== 'ships');
    const cardsNeeded = MARKET_SIZE - newMarket.length;
    newMarket = [...newMarket, ...deck.slice(0, cardsNeeded)];

    const newPlayers = [...players] as [Player, Player];
    newPlayers[currentPlayerIndex] = { ...player };

    set({
      market: newMarket,
      deck: deck.slice(cardsNeeded),
      players: newPlayers,
      lastAction: {
        type: 'take-ships',
        playerName: player.name,
        description: `took ${ships.length} ship${ships.length > 1 ? 's' : ''}`,
        cardsInvolved: ships,
      },
    });

    get().endTurn();
  },

  exchangeCards: (handCardIds, marketCardIds) => {
    const { market, deck, players, currentPlayerIndex } = get();
    const player = players[currentPlayerIndex];

    // Get cards to exchange (from both hand and ships)
    const handCards = player.hand.filter((c) => handCardIds.includes(c.id));
    const handShips = player.ships.filter((c) => handCardIds.includes(c.id));
    const marketCards = market.filter((c) => marketCardIds.includes(c.id));

    // Validate exchange - total cards from hand + ships must match market cards
    const totalFromHand = handCards.length + handShips.length;
    if (totalFromHand !== marketCards.length) return;
    if (totalFromHand < 2) return;

    // Calculate resulting hand size (ships don't count toward hand limit)
    const nonShipMarketCards = marketCards.filter((c) => c.type !== 'ships').length;
    const newHandSize = player.hand.length - handCards.length + nonShipMarketCards;
    if (newHandSize > HAND_LIMIT) return;

    // Perform exchange
    const newHand = player.hand.filter((c) => !handCardIds.includes(c.id));
    const newShips = player.ships.filter((c) => !handCardIds.includes(c.id));
    
    marketCards.forEach((card) => {
      if (card.type === 'ships') {
        newShips.push(card);
      } else {
        newHand.push(card);
      }
    });

    const newMarket = [
      ...market.filter((c) => !marketCardIds.includes(c.id)),
      ...handCards,
      ...handShips,
    ];

    const newPlayers = [...players] as [Player, Player];
    newPlayers[currentPlayerIndex] = {
      ...player,
      hand: newHand,
      ships: newShips,
    };

    set({
      market: newMarket,
      players: newPlayers,
      lastAction: {
        type: 'exchange',
        playerName: player.name,
        description: `exchanged ${marketCards.length} cards`,
        cardsGiven: [...handCards, ...handShips],
        cardsReceived: marketCards,
      },
    });

    get().endTurn();
  },

  sellCards: (cardIds) => {
    const { players, currentPlayerIndex, tokenStacks, bonusTokens } = get();
    const player = players[currentPlayerIndex];

    const cardsToSell = player.hand.filter((c) => cardIds.includes(c.id));
    if (cardsToSell.length === 0) return;

    // All cards must be same type
    const type = cardsToSell[0].type as GoodsType;
    if (!cardsToSell.every((c) => c.type === type)) return;

    // Check minimum for expensive goods
    const expensive: GoodsType[] = ['gold', 'silver', 'gemstones'];
    if (expensive.includes(type) && cardsToSell.length < MIN_SELL_EXPENSIVE) return;

    // Take tokens
    const tokens = tokenStacks[type].splice(0, cardsToSell.length);
    player.tokens.push(...tokens);

    // Award bonus token
    let bonus: BonusToken | undefined;
    if (cardsToSell.length >= 5 && bonusTokens.five.length > 0) {
      bonus = bonusTokens.five.shift();
    } else if (cardsToSell.length === 4 && bonusTokens.four.length > 0) {
      bonus = bonusTokens.four.shift();
    } else if (cardsToSell.length === 3 && bonusTokens.three.length > 0) {
      bonus = bonusTokens.three.shift();
    }
    if (bonus) player.bonusTokens.push(bonus);

    // Remove cards from hand
    const newHand = player.hand.filter((c) => !cardIds.includes(c.id));

    const newPlayers = [...players] as [Player, Player];
    newPlayers[currentPlayerIndex] = { ...player, hand: newHand };

    const tokensValue = tokens.reduce((sum, t) => sum + t.value, 0);
    const bonusValue = bonus?.value || 0;

    set({
      players: newPlayers,
      tokenStacks: { ...tokenStacks },
      bonusTokens: { ...bonusTokens },
      lastAction: {
        type: 'sell',
        playerName: player.name,
        description: `sold ${cardsToSell.length} ${type}`,
        cardsInvolved: cardsToSell,
        tokensEarned: tokensValue,
        bonusEarned: bonusValue,
      },
    });

    get().endTurn();
  },

  pirateRaid: (targetCardId) => {
    const { players, currentPlayerIndex, optionalRules } = get();
    if (!optionalRules.pirateRaid) return;

    const player = players[currentPlayerIndex];
    if (player.hasUsedPirateRaid) return;
    if (player.hand.length >= HAND_LIMIT) return;

    const opponentIndex = currentPlayerIndex === 0 ? 1 : 0;
    const opponent = players[opponentIndex];

    const cardIndex = opponent.hand.findIndex((c) => c.id === targetCardId);
    if (cardIndex === -1) return;

    const stolenCard = opponent.hand[cardIndex];
    
    // Remove from opponent and add to player
    const newOpponentHand = opponent.hand.filter((c) => c.id !== targetCardId);
    const newPlayerHand = [...player.hand, stolenCard];

    const newPlayers = [...players] as [Player, Player];
    newPlayers[currentPlayerIndex] = { 
      ...player, 
      hand: newPlayerHand,
      hasUsedPirateRaid: true,
    };
    newPlayers[opponentIndex] = { ...opponent, hand: newOpponentHand };

    set({
      players: newPlayers,
      lastAction: {
        type: 'raid',
        playerName: player.name,
        description: `raided ${opponent.name}'s ${stolenCard.type}!`,
        cardsInvolved: [stolenCard],
      },
    });

    get().endTurn();
  },

  endTurn: () => {
    const fullState = { ...get() } as GameState;
    const newTurnCount = fullState.turnCount + 1;
    fullState.turnCount = newTurnCount;

    // Check for round end
    if (get().isRoundOver()) {
      // Fire round-end hooks (e.g. treasure chest reveal)
      const roundCtx: RoundEndContext = {
        ...buildCtx(fullState),
        round: fullState.round,
      };
      rulesEngine.fireRoundEnd(roundCtx);

      const winner = get().getRoundWinner();
      const roundWins = [...fullState.roundWins] as [number, number];
      if (winner) {
        const winnerIndex = fullState.players.findIndex((p) => p.id === winner.id);
        roundWins[winnerIndex]++;
      }
      set({
        players: fullState.players,
        hiddenTreasures: fullState.hiddenTreasures,
        phase: 'roundEnd',
        roundWins,
        turnCount: newTurnCount,
      });
      return;
    }

    // Fire turn-end hooks (e.g. storm)
    const turnCtx: TurnEndContext = {
      ...buildCtx(fullState),
      turnCount: newTurnCount,
    };
    rulesEngine.fireTurnEnd(turnCtx);

    const nextIndex = fullState.currentPlayerIndex === 0 ? 1 : 0;
    const currentAction = get().lastAction;
    const { isMultiplayer } = get();
    const { players } = fullState;

    set({
      currentPlayerIndex: nextIndex,
      turnCount: newTurnCount,
      market: fullState.market,
      deck: fullState.deck,
      lastAction: turnCtx.injectedAction || currentAction,
    });

    // If next player is AI and not multiplayer, trigger AI move
    if (players[nextIndex].isAI && !isMultiplayer) {
      setTimeout(() => get().makeAIMove(), 1000);
    }
  },

  nextRound: () => {
    const { round, maxRounds, roundWins, optionalRules } = get();
    
    // Check if game is over
    if (round >= maxRounds || roundWins[0] >= 2 || roundWins[1] >= 2) {
      set({ phase: 'gameEnd' });
      return;
    }

    // Start new round
    const deck = createDeck();
    const market: Card[] = [];
    const players = get().players.map((p) => ({
      ...p,
      hand: [],
      ships: [],
      tokens: [],
      bonusTokens: [],
      hasUsedPirateRaid: false, // Reset pirate raid for new round
    })) as [Player, Player];

    // Deal initial market
    let shipCount = 0;
    const remainingDeck: Card[] = [];
    
    for (const card of deck) {
      if (shipCount < 3 && card.type === 'ships') {
        market.push(card);
        shipCount++;
      } else {
        remainingDeck.push(card);
      }
    }
    market.push(...remainingDeck.splice(0, 2));

    // Deal cards
    for (let i = 0; i < 5; i++) {
      const card1 = remainingDeck.shift();
      const card2 = remainingDeck.shift();
      if (card1) {
        if (card1.type === 'ships') players[0].ships.push(card1);
        else players[0].hand.push(card1);
      }
      if (card2) {
        if (card2.type === 'ships') players[1].ships.push(card2);
        else players[1].hand.push(card2);
      }
    }

    const newState: GameState = {
      ...get(),
      phase: 'playing',
      deck: remainingDeck,
      market,
      players,
      tokenStacks: createTokenStacks(),
      bonusTokens: createBonusTokens(),
      currentPlayerIndex: 0,
      round: round + 1,
      lastAction: null,
      turnCount: 0,
      hiddenTreasures: [],
    };

    // Fire deal hooks (e.g. treasure chest creates hidden tokens)
    const ctx = buildCtx(newState);
    rulesEngine.fireDeal(ctx);

    set(newState);
  },

  resetGame: () => {
    set({
      phase: 'lobby',
      market: [],
      deck: [],
      tokenStacks: createTokenStacks(),
      bonusTokens: createBonusTokens(),
      players: [createPlayer('1', 'Player'), createPlayer('2', 'Pirate AI', true)],
      currentPlayerIndex: 0,
      round: 1,
      roundWins: [0, 0],
      lastAction: null,
      optionalRules: defaultOptionalRules,
      turnCount: 0,
      hiddenTreasures: [],
      isMultiplayer: false,
    });
  },

  makeAIMove: () => {
    const { market, players, currentPlayerIndex, tokenStacks, bonusTokens, difficulty, optionalRules } = get();
    const ai = players[currentPlayerIndex];
    if (!ai.isAI) return;

    const opponent = players[currentPlayerIndex === 0 ? 1 : 0];

    // ============= STRATEGIC AI CONFIGURATION =============
    const difficultyWeights = {
      easy: { blocking: 0, bonusPursuit: 0.5, sellPatience: 0, tokenUrgency: 0.3, randomVariance: 0.5 },
      medium: { blocking: 0.3, bonusPursuit: 0.8, sellPatience: 0.5, tokenUrgency: 0.6, randomVariance: 0.25 },
      hard: { blocking: 0.8, bonusPursuit: 1.2, sellPatience: 1.0, tokenUrgency: 1.0, randomVariance: 0.1 },
      expert: { blocking: 1.0, bonusPursuit: 1.5, sellPatience: 1.2, tokenUrgency: 1.2, randomVariance: 0 },
    };
    const weights = difficultyWeights[difficulty];

    // ============= HELPER FUNCTIONS =============

    // Get card counts by type for a player
    const getCardCounts = (player: Player): Record<GoodsType, number> => {
      const counts: Record<GoodsType, number> = {} as Record<GoodsType, number>;
      const goodsTypes: GoodsType[] = ['rum', 'cannonballs', 'silks', 'silver', 'gold', 'gemstones'];
      goodsTypes.forEach(type => {
        counts[type] = player.hand.filter(c => c.type === type).length;
      });
      return counts;
    };

    // Evaluate how urgently a goods type should be collected/sold (based on remaining high-value tokens)
    const evaluateTokenUrgency = (type: GoodsType): number => {
      const stack = tokenStacks[type];
      if (stack.length === 0) return 0;
      
      // Higher urgency when fewer tokens remain and they're still valuable
      const remainingValue = stack.slice(0, 3).reduce((sum, t) => sum + t.value, 0);
      const scarcityBonus = Math.max(0, (5 - stack.length) * 2);
      return (remainingValue / 3) + scarcityBonus;
    };

    // Evaluate if opponent is collecting a type (blocking score)
    const evaluateBlockingValue = (type: GoodsType): number => {
      const opponentCount = opponent.hand.filter(c => c.type === type).length;
      if (opponentCount >= 3) return 8; // Critical - they're close to bonus
      if (opponentCount >= 2) return 4; // Moderate threat
      if (opponentCount >= 1) return 1;
      return 0;
    };

    // Evaluate bonus potential for selling X cards
    const evaluateBonusPotential = (cardCount: number): number => {
      if (cardCount >= 5 && bonusTokens.five.length > 0) {
        return bonusTokens.five[0].value + 4; // 5-card bonus is huge
      }
      if (cardCount >= 4 && bonusTokens.four.length > 0) {
        return bonusTokens.four[0].value + 2;
      }
      if (cardCount >= 3 && bonusTokens.three.length > 0) {
        return bonusTokens.three[0].value;
      }
      return 0;
    };

    // Calculate sell timing penalty/bonus
    const evaluateSellTiming = (type: GoodsType, cardCount: number): number => {
      const aiCardCount = ai.hand.filter(c => c.type === type).length;
      const stack = tokenStacks[type];
      
      // If tokens are running out, sell now
      if (stack.length <= cardCount) return 3;
      
      // Penalty for selling small amounts when we could wait for bonus
      if (cardCount < 3 && aiCardCount < 4) {
        // Check if we might get more of this type
        const marketHas = market.filter(c => c.type === type).length;
        if (marketHas > 0 || stack.length > cardCount + 2) {
          return -4 * weights.sellPatience; // Wait for bigger sale
        }
      }
      
      return 0;
    };

    // Evaluate taking a card's value
    const evaluateTakeValue = (type: GoodsType): number => {
      const stack = tokenStacks[type];
      if (stack.length === 0) return -2;
      
      const aiCount = ai.hand.filter(c => c.type === type).length;
      let score = stack[0].value;
      
      // Bonus for building toward 3/4/5 card bonuses
      if (aiCount === 4) score += 10 * weights.bonusPursuit; // Getting to 5!
      else if (aiCount === 3) score += 6 * weights.bonusPursuit; // Getting to 4
      else if (aiCount === 2) score += 4 * weights.bonusPursuit; // Getting to 3
      else if (aiCount === 1) score += 2 * weights.bonusPursuit;
      
      // Token urgency - prioritize scarce high-value tokens
      score += evaluateTokenUrgency(type) * weights.tokenUrgency;
      
      // Blocking value
      score += evaluateBlockingValue(type) * weights.blocking;
      
      return score;
    };

    // Evaluate an exchange opportunity
    const evaluateExchange = (handCardIds: string[], marketCardIds: string[]): number => {
      const handCards = ai.hand.filter(c => handCardIds.includes(c.id));
      const handShips = ai.ships.filter(c => handCardIds.includes(c.id));
      const marketCards = market.filter(c => marketCardIds.includes(c.id));
      
      if (handCards.length + handShips.length !== marketCards.length) return -100;
      if (marketCards.length < 2) return -100;
      
      // Check hand limit
      const nonShipMarketCards = marketCards.filter(c => c.type !== 'ships').length;
      const newHandSize = ai.hand.length - handCards.length + nonShipMarketCards;
      if (newHandSize > HAND_LIMIT) return -100;
      
      // Calculate value of cards we're giving up
      let givenValue = 0;
      handCards.forEach(c => {
        if (c.type !== 'ships') {
          const type = c.type as GoodsType;
          const stack = tokenStacks[type];
          givenValue += stack.length > 0 ? stack[0].value * 0.5 : 1; // Discount since not sold yet
        }
      });
      // Ships have low opportunity cost
      givenValue += handShips.length * 0.5;
      
      // Calculate value of cards we're getting
      let gainedValue = 0;
      let bonusOpportunity = 0;
      marketCards.forEach(c => {
        if (c.type !== 'ships') {
          const type = c.type as GoodsType;
          gainedValue += evaluateTakeValue(type);
          
          // Check if this enables a bonus sale
          const aiCount = ai.hand.filter(hc => hc.type === type).length;
          const incomingCount = marketCards.filter(mc => mc.type === type).length;
          const futureCount = aiCount + incomingCount - handCards.filter(hc => hc.type === type).length;
          bonusOpportunity += evaluateBonusPotential(futureCount);
        }
      });
      
      return gainedValue - givenValue + (bonusOpportunity * weights.bonusPursuit);
    };

    // ============= BUILD ACTION LIST =============
    const actions: { action: () => void; score: number; description: string }[] = [];

    // --- PIRATE RAID ---
    if (optionalRules.pirateRaid && !ai.hasUsedPirateRaid && ai.hand.length < HAND_LIMIT) {
      opponent.hand.forEach((card) => {
        if (card.type === 'ships') return;
        
        const type = card.type as GoodsType;
        let score = evaluateTakeValue(type);
        
        // On hard, target cards opponent is collecting
        const opponentCount = opponent.hand.filter(c => c.type === type).length;
        if (opponentCount >= 3) score += 10 * weights.blocking; // Disrupt their bonus
        
        // Also consider what we need
        const aiCount = ai.hand.filter(c => c.type === type).length;
        if (aiCount >= 3) score += 8; // Complete our set
        
        actions.push({ 
          action: () => get().pirateRaid(card.id), 
          score: score + 5, // Raid has inherent value (one-time use)
          description: `raid ${type}`
        });
      });
    }

    // --- TAKE SINGLE CARD ---
    market.forEach((card) => {
      if (card.type === 'ships') return;
      if (ai.hand.length >= HAND_LIMIT) return;
      
      const type = card.type as GoodsType;
      const score = evaluateTakeValue(type);
      
      actions.push({ 
        action: () => get().takeCard(card.id), 
        score,
        description: `take ${type}`
      });
    });

    // --- TAKE ALL SHIPS ---
    const ships = market.filter((c) => c.type === 'ships');
    if (ships.length > 0) {
      // Ships are valuable for exchanges and end-game bonus
      let score = ships.length * 2;
      // More valuable when we have cards to exchange
      if (ai.hand.length >= 5) score += 3;
      // Less valuable if we already have many
      if (ai.ships.length >= 5) score -= 2;
      
      actions.push({
        action: () => get().takeAllShips(),
        score,
        description: `take ${ships.length} ships`
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
        
        // Calculate base token value
        let score = 0;
        for (let i = 0; i < Math.min(cards.length, stack.length); i++) {
          score += stack[i].value;
        }
        
        // Add bonus token value
        score += evaluateBonusPotential(cards.length);
        
        // Sell timing adjustment
        score += evaluateSellTiming(goodsType, cards.length);
        
        // Token urgency - sell if tokens running out
        if (stack.length <= cards.length + 1) {
          score += 5 * weights.tokenUrgency; // Urgent sale
        }
        
        actions.push({
          action: () => get().sellCards(cards.map((c) => c.id)),
          score,
          description: `sell ${cards.length} ${type}`
        });
      }
    });

    // --- EXCHANGE CARDS ---
    // Only evaluate on medium/hard or if we have ships to trade
    if (difficulty !== 'easy' || ai.ships.length >= 2) {
      const goodsInMarket = market.filter(c => c.type !== 'ships');
      
      // Strategy: Trade ships + low-value goods for high-value market cards
      if (goodsInMarket.length >= 2) {
        // Find valuable market cards worth getting
        const valuableMarket = goodsInMarket
          .filter(c => {
            const type = c.type as GoodsType;
            return evaluateTakeValue(type) >= 4;
          })
          .slice(0, 3);
        
        if (valuableMarket.length >= 2) {
          // Find low-value cards to give up
          const expendable: Card[] = [];
          
          // Ships are great for trading
          expendable.push(...ai.ships.slice(0, 2));
          
          // Add low-value goods (where we only have 1 and token stack is low value)
          Object.entries(cardsByType).forEach(([type, cards]) => {
            if (cards.length === 1) {
              const stack = tokenStacks[type as GoodsType];
              if (stack.length > 0 && stack[0].value <= 3) {
                expendable.push(cards[0]);
              }
            }
          });
          
          if (expendable.length >= 2) {
            // Try exchange combinations
            const numToTrade = Math.min(expendable.length, valuableMarket.length, 3);
            
            const handToGive = expendable.slice(0, numToTrade).map(c => c.id);
            const marketToTake = valuableMarket.slice(0, numToTrade).map(c => c.id);
            
            const exchangeScore = evaluateExchange(handToGive, marketToTake);
            
            if (exchangeScore > 0) {
              actions.push({
                action: () => get().exchangeCards(handToGive, marketToTake),
                score: exchangeScore,
                description: `exchange ${numToTrade} cards`
              });
            }
          }
        }
      }
    }

    // ============= SELECT ACTION =============
    if (actions.length === 0) return;

    // Sort by score descending
    actions.sort((a, b) => b.score - a.score);

    let chosenIndex = 0;
    
    // Apply randomness based on difficulty
    if (weights.randomVariance > 0) {
      const random = secureRandom();
      if (random < weights.randomVariance) {
        // Pick from top 3 instead of always best
        const topN = Math.min(3, actions.length);
        chosenIndex = secureRandomInt(topN);
      }
    }

    // Execute chosen action
    actions[chosenIndex].action();
  },

  canTakeCard: (cardId) => {
    const { market, players, currentPlayerIndex } = get();
    const card = market.find((c) => c.id === cardId);
    if (!card) return false;
    
    const player = players[currentPlayerIndex];
    if (card.type === 'ships') return true;
    return player.hand.length < HAND_LIMIT;
  },

  canSellCards: (cardIds) => {
    const { players, currentPlayerIndex } = get();
    const player = players[currentPlayerIndex];
    
    const cards = player.hand.filter((c) => cardIds.includes(c.id));
    if (cards.length === 0) return false;
    
    const type = cards[0].type;
    if (!cards.every((c) => c.type === type)) return false;
    
    const expensive = ['gold', 'silver', 'gemstones'];
    if (expensive.includes(type) && cards.length < MIN_SELL_EXPENSIVE) return false;
    
    return true;
  },

  canExchange: (handCardIds, marketCardIds) => {
    if (handCardIds.length < 2 || marketCardIds.length < 2) return false;
    if (handCardIds.length !== marketCardIds.length) return false;
    return true;
  },

  canUsePirateRaid: () => {
    const { players, currentPlayerIndex, optionalRules } = get();
    if (!optionalRules.pirateRaid) return false;
    
    const player = players[currentPlayerIndex];
    if (player.hasUsedPirateRaid) return false;
    if (player.hand.length >= HAND_LIMIT) return false;
    
    const opponent = players[currentPlayerIndex === 0 ? 1 : 0];
    return opponent.hand.length > 0;
  },

  getCurrentPlayer: () => {
    const { players, currentPlayerIndex } = get();
    return players[currentPlayerIndex];
  },

  getOpponent: () => {
    const { players, currentPlayerIndex } = get();
    return players[currentPlayerIndex === 0 ? 1 : 0];
  },

  isGameOver: () => {
    const { roundWins, round, maxRounds } = get();
    return roundWins[0] >= 2 || roundWins[1] >= 2 || round > maxRounds;
  },

  isRoundOver: () => {
    const { deck, tokenStacks, market } = get();
    
    // Deck empty
    if (deck.length === 0 && market.length < MARKET_SIZE) return true;
    
    // 3 token stacks empty
    const emptyStacks = Object.values(tokenStacks).filter((s) => s.length === 0).length;
    return emptyStacks >= 3;
  },

  getWinner: () => {
    const { players, roundWins } = get();
    if (roundWins[0] >= 2) return players[0];
    if (roundWins[1] >= 2) return players[1];
    if (roundWins[0] > roundWins[1]) return players[0];
    if (roundWins[1] > roundWins[0]) return players[1];
    return null;
  },

  getRoundWinner: () => {
    const { players } = get();
    const score0 = calculateScore(players[0]);
    const score1 = calculateScore(players[1]);
    
    if (score0 > score1) return players[0];
    if (score1 > score0) return players[1];
    
    // Tie breaker: most bonus tokens
    if (players[0].bonusTokens.length > players[1].bonusTokens.length) return players[0];
    if (players[1].bonusTokens.length > players[0].bonusTokens.length) return players[1];
    
    // Tie breaker: most goods tokens
    if (players[0].tokens.length > players[1].tokens.length) return players[0];
    if (players[1].tokens.length > players[0].tokens.length) return players[1];
    
    return null;
  },

  getRevealedTreasures: () => {
    const { hiddenTreasures, phase, optionalRules } = get();
    if (!optionalRules.treasureChest) return [];
    if (phase !== 'roundEnd' && phase !== 'gameEnd') return [];
    return hiddenTreasures;
  },
}));
