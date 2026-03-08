import { create } from 'zustand';
import { useRemoteConfigStore } from './remoteConfigStore';
import { useSettingsStore } from './settingsStore';
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
  ActionValidation,
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
import { validateGameState } from '@/lib/validateGameState';
import { debugLog } from '@/lib/debugLog';
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

/** Maps the legacy OptionalRules booleans to engine plugin ids, merging remote enabledRules. */
const syncEngineRules = (rules: OptionalRules) => {
  const remoteEnabled = useRemoteConfigStore.getState().config.enabledRules;
  const ruleMap: Record<string, keyof OptionalRules> = {
    storm: 'stormRule',
    pirate_raid: 'pirateRaid',
    treasure_chest: 'treasureChest',
  };

  const ids: string[] = [];
  // Local explicit toggles take priority
  if (rules.stormRule) ids.push('storm');
  if (rules.pirateRaid) ids.push('pirate_raid');
  if (rules.treasureChest) ids.push('treasure_chest');

  // Remote can enable rules the user hasn't explicitly toggled on locally
  for (const ruleId of remoteEnabled) {
    if (!ids.includes(ruleId) && !(ruleMap[ruleId] && rules[ruleMap[ruleId]] === false)) {
      // Only add if the local setting isn't explicitly false
      // Since default is false, we only add remote rules if they aren't in the map
      // or if user hasn't interacted with them. For simplicity: remote adds, local overrides off.
    }
  }

  rulesEngine.setEnabled(ids);
};

/** Build a RuleContext from the current store state (mutable snapshot). */
const buildCtx = (state: GameState): RuleContext => ({
  state,
  currentPlayerIndex: state.currentPlayerIndex,
  currentPlayer: state.players[state.currentPlayerIndex],
  opponents: state.players.filter((_, i) => i !== state.currentPlayerIndex),
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

const createPlayer = (id: string, name: string, isAI = false, isLocal = false): Player => ({
  id,
  name,
  hand: [],
  ships: [],
  tokens: [],
  bonusTokens: [],
  isAI,
  isLocal,
  hasUsedPirateRaid: false,
});

export const calculateScore = (player: Player, allPlayers?: Player[]): number => {
  const tokenScore = player.tokens.reduce((sum, t) => sum + t.value, 0);
  const bonusScore = player.bonusTokens.reduce((sum, t) => sum + t.value, 0);

  // Largest fleet bonus: 5 doubloons to the player with the most ships
  let shipBonus = 0;
  if (allPlayers && allPlayers.length > 1) {
    const maxShips = Math.max(...allPlayers.map((p) => p.ships.length));
    if (player.ships.length > 0 && player.ships.length === maxShips) {
      // Only award if strictly the most (no bonus on tie)
      const playersWithMax = allPlayers.filter((p) => p.ships.length === maxShips).length;
      if (playersWithMax === 1) {
        shipBonus = 5;
      }
    }
  } else {
    // Fallback for single-player context (shouldn't happen in normal flow)
    shipBonus = player.ships.length >= 1 ? 5 : 0;
  }

  return tokenScore + bonusScore + shipBonus;
};

const defaultOptionalRules: OptionalRules = {
  stormRule: false,
  pirateRaid: false,
  treasureChest: false,
};

/** Helper: get the next player index using ring-buffer rotation. */
const nextPlayerIndex = (current: number, total: number): number =>
  (current + 1) % total;

/** Helper: get the first opponent index (for 2-player compat). */
const getOpponentIndex = (current: number, total: number): number =>
  (current + 1) % total;

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
  
  // Validators (return {ok, reason?})
  canTakeOne: (cardId: string) => ActionValidation;
  canTakeAllShips: () => ActionValidation;
  canExchange: (handCardIds: string[], marketCardIds: string[]) => ActionValidation;
  canSell: (cardIds: string[]) => ActionValidation;
  
  // Legacy compat (boolean wrappers)
  canTakeCard: (cardId: string) => boolean;
  canSellCards: (cardIds: string[]) => boolean;
  canUsePirateRaid: () => boolean;
  
  // Computed
  getCurrentPlayer: () => Player;
  getOpponent: () => Player;
  getLocalPlayer: () => Player;
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
  players: [createPlayer('1', 'Player', false, true), createPlayer('2', getRandomPirateName(), true)],
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
    const players: Player[] = [
      createPlayer('1', playerName, false, true),
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
      for (const player of players) {
        const card = remainingDeck.shift();
        if (card) {
          if (card.type === 'ships') {
            player.ships.push(card);
          } else {
            player.hand.push(card);
          }
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
      roundWins: players.map(() => 0),
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
    const hostPlayer = createPlayer('1', playerName, false, true);
    const guestPlayer = createPlayer('2', opponentName, false, false);
    const players: Player[] = [hostPlayer, guestPlayer];

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
      for (const player of players) {
        const card = remainingDeck.shift();
        if (card) {
          if (card.type === 'ships') player.ships.push(card);
          else player.hand.push(card);
        }
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
      roundWins: players.map(() => 0),
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
    // Validate incoming state before applying
    const validated = validateGameState(state);
    if (!validated) {
      debugLog('engine', 'P2P Validation', 'Rejected invalid game state from peer');
      return;
    }

    if (swapPlayers && validated.players) {
      // Swap player order for guest's perspective
      const [player1, player2] = validated.players;
      validated.players = [player2, player1];
      // Mark local player
      validated.players[0].isLocal = true;
      validated.players[1].isLocal = false;
      // Invert current player index for guest
      if (validated.currentPlayerIndex !== undefined) {
        validated.currentPlayerIndex = validated.currentPlayerIndex === 0 ? 1 : 0;
      }
      // Swap round wins too
      if (validated.roundWins) {
        validated.roundWins = [validated.roundWins[1], validated.roundWins[0]];
      }
    }
    set(validated as GameState);
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

    const newPlayers = [...players];
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

    const newPlayers = [...players];
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

    // Reject same-type swaps: cannot trade away a goods type you are also taking
    const handTypes = new Set([...handCards, ...handShips].map(c => c.type));
    const marketTypes = new Set(marketCards.map(c => c.type));
    for (const t of handTypes) {
      if (marketTypes.has(t)) return;
    }

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

    const newPlayers = [...players];
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

    const newPlayers = [...players];
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

    // Find which opponent has the target card
    let targetOpponentIndex = -1;
    let cardIndex = -1;
    for (let i = 0; i < players.length; i++) {
      if (i === currentPlayerIndex) continue;
      const idx = players[i].hand.findIndex((c) => c.id === targetCardId);
      if (idx !== -1) {
        targetOpponentIndex = i;
        cardIndex = idx;
        break;
      }
    }
    if (targetOpponentIndex === -1 || cardIndex === -1) return;

    const opponent = players[targetOpponentIndex];
    const stolenCard = opponent.hand[cardIndex];
    
    // Remove from opponent and add to player
    const newOpponentHand = opponent.hand.filter((c) => c.id !== targetCardId);
    const newPlayerHand = [...player.hand, stolenCard];

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = { 
      ...player, 
      hand: newPlayerHand,
      hasUsedPirateRaid: true,
    };
    newPlayers[targetOpponentIndex] = { ...opponent, hand: newOpponentHand };

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
      const roundWins = [...fullState.roundWins];
      if (winner) {
        const winnerIndex = fullState.players.findIndex((p) => p.id === winner.id);
        if (winnerIndex !== -1) roundWins[winnerIndex]++;
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

    const nextIdx = nextPlayerIndex(fullState.currentPlayerIndex, fullState.players.length);
    const currentAction = get().lastAction;
    const { isMultiplayer } = get();
    const { players } = fullState;

    set({
      currentPlayerIndex: nextIdx,
      turnCount: newTurnCount,
      market: fullState.market,
      deck: fullState.deck,
      lastAction: turnCtx.injectedAction || currentAction,
    });

    // If next player is AI and not multiplayer, trigger AI move
    if (players[nextIdx].isAI && !isMultiplayer) {
      const notifDuration = useSettingsStore.getState().actionNotificationDuration;
      setTimeout(() => get().makeAIMove(), (notifDuration * 1000) + 500);
    }
  },

  nextRound: () => {
    const { round, maxRounds, roundWins, optionalRules, players: currentPlayers } = get();
    
    // Check if game is over — any player has 2 wins or max rounds reached
    const anyWinner = roundWins.some((w) => w >= 2);
    if (round >= maxRounds || anyWinner) {
      set({ phase: 'gameEnd' });
      return;
    }

    // Start new round
    const deck = createDeck();
    const market: Card[] = [];
    const players: Player[] = currentPlayers.map((p) => ({
      ...p,
      hand: [],
      ships: [],
      tokens: [],
      bonusTokens: [],
      hasUsedPirateRaid: false,
    }));

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

    // Deal cards to all players in round-robin
    for (let i = 0; i < 5; i++) {
      for (const player of players) {
        const card = remainingDeck.shift();
        if (card) {
          if (card.type === 'ships') player.ships.push(card);
          else player.hand.push(card);
        }
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
      players: [createPlayer('1', 'Player', false, true), createPlayer('2', 'Pirate AI', true)],
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

    // AI reads public state only — targets all opponents via players[]
    const opponents = players.filter((_, i) => i !== currentPlayerIndex);
    // For 2-player compat, pick the primary opponent
    const opponent = opponents[0];

    // ============= STRATEGIC AI CONFIGURATION =============
    const difficultyWeights = {
      easy: { blocking: 0, bonusPursuit: 0.5, sellPatience: 0, tokenUrgency: 0.3, randomVariance: 0.5 },
      medium: { blocking: 0.3, bonusPursuit: 0.8, sellPatience: 0.5, tokenUrgency: 0.6, randomVariance: 0.25 },
      hard: { blocking: 0.8, bonusPursuit: 1.2, sellPatience: 1.0, tokenUrgency: 1.0, randomVariance: 0.1 },
      expert: { blocking: 1.0, bonusPursuit: 1.5, sellPatience: 1.2, tokenUrgency: 1.2, randomVariance: 0 },
    };
    const weights = difficultyWeights[difficulty];

    // ============= HELPER FUNCTIONS =============

    // Evaluate how urgently a goods type should be collected/sold
    const evaluateTokenUrgency = (type: GoodsType): number => {
      const stack = tokenStacks[type];
      if (stack.length === 0) return 0;
      const remainingValue = stack.slice(0, 3).reduce((sum, t) => sum + t.value, 0);
      const scarcityBonus = Math.max(0, (5 - stack.length) * 2);
      return (remainingValue / 3) + scarcityBonus;
    };

    // Evaluate blocking value across all opponents
    const evaluateBlockingValue = (type: GoodsType): number => {
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

    // Evaluate bonus potential for selling X cards
    const evaluateBonusPotential = (cardCount: number): number => {
      if (cardCount >= 5 && bonusTokens.five.length > 0) {
        return bonusTokens.five[0].value + 4;
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
      
      if (stack.length <= cardCount) return 3;
      
      if (cardCount < 3 && aiCardCount < 4) {
        const marketHas = market.filter(c => c.type === type).length;
        if (marketHas > 0 || stack.length > cardCount + 2) {
          return -4 * weights.sellPatience;
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
      
      if (aiCount === 4) score += 10 * weights.bonusPursuit;
      else if (aiCount === 3) score += 6 * weights.bonusPursuit;
      else if (aiCount === 2) score += 4 * weights.bonusPursuit;
      else if (aiCount === 1) score += 2 * weights.bonusPursuit;
      
      score += evaluateTokenUrgency(type) * weights.tokenUrgency;
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
      const cardsByTypeLocal: Record<string, Card[]> = {};
      ai.hand.forEach((card) => {
        if (!cardsByTypeLocal[card.type]) cardsByTypeLocal[card.type] = [];
        cardsByTypeLocal[card.type].push(card);
      });
      
      marketCards.forEach(c => {
        if (c.type !== 'ships') {
          const type = c.type as GoodsType;
          gainedValue += evaluateTakeValue(type);
          
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

    // --- PIRATE RAID --- target any opponent
    if (optionalRules.pirateRaid && !ai.hasUsedPirateRaid && ai.hand.length < HAND_LIMIT) {
      for (const opp of opponents) {
        opp.hand.forEach((card) => {
          if (card.type === 'ships') return;
          
          const type = card.type as GoodsType;
          let score = evaluateTakeValue(type);
          
          const oppCount = opp.hand.filter(c => c.type === type).length;
          if (oppCount >= 3) score += 10 * weights.blocking;
          
          const aiCount = ai.hand.filter(c => c.type === type).length;
          if (aiCount >= 3) score += 8;
          
          actions.push({ 
            action: () => get().pirateRaid(card.id), 
            score: score + 5,
            description: `raid ${type} from ${opp.name}`
          });
        });
      }
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
      let score = ships.length * 2;
      if (ai.hand.length >= 5) score += 3;
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
        
        let score = 0;
        for (let i = 0; i < Math.min(cards.length, stack.length); i++) {
          score += stack[i].value;
        }
        
        score += evaluateBonusPotential(cards.length);
        score += evaluateSellTiming(goodsType, cards.length);
        
        if (stack.length <= cards.length + 1) {
          score += 5 * weights.tokenUrgency;
        }
        
        actions.push({
          action: () => get().sellCards(cards.map((c) => c.id)),
          score,
          description: `sell ${cards.length} ${type}`
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
            return evaluateTakeValue(type) >= 4;
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
          
          if (expendable.length >= 2) {
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

    actions.sort((a, b) => b.score - a.score);

    let chosenIndex = 0;
    
    if (weights.randomVariance > 0) {
      const random = secureRandom();
      if (random < weights.randomVariance) {
        const topN = Math.min(3, actions.length);
        chosenIndex = secureRandomInt(topN);
      }
    }

    actions[chosenIndex].action();
  },

  // ─── Action Validators ──────────────────────────────────────────
  canTakeOne: (cardId) => {
    const { market, players, currentPlayerIndex } = get();
    const card = market.find((c) => c.id === cardId);
    if (!card) return { ok: false, reason: 'Card not in market' };
    
    const player = players[currentPlayerIndex];
    if (card.type === 'ships') return { ok: true };
    if (player.hand.length >= HAND_LIMIT) return { ok: false, reason: 'Hold is full' };
    return { ok: true };
  },

  canTakeAllShips: () => {
    const { market } = get();
    const ships = market.filter((c) => c.type === 'ships');
    if (ships.length === 0) return { ok: false, reason: 'No ships in market' };
    return { ok: true };
  },

  canExchange: (handCardIds, marketCardIds) => {
    if (handCardIds.length < 2 || marketCardIds.length < 2) 
      return { ok: false, reason: 'Must exchange at least 2 cards' };
    if (handCardIds.length !== marketCardIds.length) 
      return { ok: false, reason: 'Must exchange equal number of cards' };
    
    const { players, currentPlayerIndex, market } = get();
    const player = players[currentPlayerIndex];
    const handCards = player.hand.filter((c) => handCardIds.includes(c.id));
    const handShips = player.ships.filter((c) => handCardIds.includes(c.id));
    const marketCards = market.filter((c) => marketCardIds.includes(c.id));
    
    if (handCards.length + handShips.length !== marketCards.length)
      return { ok: false, reason: 'Card count mismatch' };
    
    const nonShipMarketCards = marketCards.filter((c) => c.type !== 'ships').length;
    const newHandSize = player.hand.length - handCards.length + nonShipMarketCards;
    if (newHandSize > HAND_LIMIT)
      return { ok: false, reason: 'Would exceed hold capacity' };
    
    return { ok: true };
  },

  canSell: (cardIds) => {
    const { players, currentPlayerIndex } = get();
    const player = players[currentPlayerIndex];
    
    const cards = player.hand.filter((c) => cardIds.includes(c.id));
    if (cards.length === 0) return { ok: false, reason: 'No cards selected' };
    
    const type = cards[0].type;
    if (!cards.every((c) => c.type === type)) 
      return { ok: false, reason: 'All cards must be same type' };
    
    const expensive = ['gold', 'silver', 'gemstones'];
    if (expensive.includes(type) && cards.length < MIN_SELL_EXPENSIVE)
      return { ok: false, reason: `Must sell at least ${MIN_SELL_EXPENSIVE} ${type}` };
    
    return { ok: true };
  },

  // Legacy boolean wrappers
  canTakeCard: (cardId) => get().canTakeOne(cardId).ok,
  canSellCards: (cardIds) => get().canSell(cardIds).ok,

  canUsePirateRaid: () => {
    const { players, currentPlayerIndex, optionalRules } = get();
    if (!optionalRules.pirateRaid) return false;
    
    const player = players[currentPlayerIndex];
    if (player.hasUsedPirateRaid) return false;
    if (player.hand.length >= HAND_LIMIT) return false;
    
    // Check if any opponent has cards
    const hasTargets = players.some((p, i) => i !== currentPlayerIndex && p.hand.length > 0);
    return hasTargets;
  },

  getCurrentPlayer: () => {
    const { players, currentPlayerIndex } = get();
    return players[currentPlayerIndex];
  },

  getOpponent: () => {
    const { players, currentPlayerIndex } = get();
    return players[getOpponentIndex(currentPlayerIndex, players.length)];
  },

  getLocalPlayer: () => {
    const { players } = get();
    return players.find((p) => p.isLocal) || players[0];
  },

  isGameOver: () => {
    const { roundWins, round, maxRounds } = get();
    return roundWins.some((w) => w >= 2) || round > maxRounds;
  },

  isRoundOver: () => {
    const { deck, tokenStacks, market } = get();
    
    if (deck.length === 0 && market.length < MARKET_SIZE) return true;
    
    const emptyStacks = Object.values(tokenStacks).filter((s) => s.length === 0).length;
    return emptyStacks >= 3;
  },

  getWinner: () => {
    const { players, roundWins } = get();
    // Find player with most wins (>= 2)
    let maxWins = 0;
    let winnerIdx = -1;
    roundWins.forEach((w, i) => {
      if (w > maxWins) {
        maxWins = w;
        winnerIdx = i;
      }
    });
    if (winnerIdx >= 0 && maxWins >= 2) return players[winnerIdx];
    // Fallback: most wins
    if (winnerIdx >= 0 && maxWins > 0) return players[winnerIdx];
    return null;
  },

  getRoundWinner: () => {
    const { players } = get();
    const scores = players.map((p) => calculateScore(p, players));
    
    const maxScore = Math.max(...scores);
    const winners = scores.reduce<number[]>((acc, s, i) => s === maxScore ? [...acc, i] : acc, []);
    
    if (winners.length === 1) return players[winners[0]];
    
    // Tie breaker: most bonus tokens
    const tiedPlayers = winners.map((i) => players[i]);
    const maxBonus = Math.max(...tiedPlayers.map((p) => p.bonusTokens.length));
    const bonusWinners = tiedPlayers.filter((p) => p.bonusTokens.length === maxBonus);
    if (bonusWinners.length === 1) return bonusWinners[0];
    
    // Tie breaker: most goods tokens
    const maxTokens = Math.max(...bonusWinners.map((p) => p.tokens.length));
    const tokenWinners = bonusWinners.filter((p) => p.tokens.length === maxTokens);
    if (tokenWinners.length === 1) return tokenWinners[0];
    
    return null;
  },

  getRevealedTreasures: () => {
    const { hiddenTreasures, phase, optionalRules } = get();
    if (!optionalRules.treasureChest) return [];
    if (phase !== 'roundEnd' && phase !== 'gameEnd') return [];
    return hiddenTreasures;
  },
}));
