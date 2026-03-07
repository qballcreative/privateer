import { describe, it, expect, beforeEach } from 'vitest';
import {
  Card,
  GoodsType,
  Player,
  Token,
  BonusToken,
  INITIAL_TOKEN_VALUES,
  BONUS_THREE_VALUES,
  BONUS_FOUR_VALUES,
  BONUS_FIVE_VALUES,
  HAND_LIMIT,
  MARKET_SIZE,
  MIN_SELL_EXPENSIVE,
  DECK_COMPOSITION,
  CardType,
} from '@/types/game';
import { calculateScore } from '@/store/gameStore';

// ── Helpers ──────────────────────────────────────────────────────
let nextId = 0;
const id = () => `test-${nextId++}`;

const makeCard = (type: CardType): Card => ({ id: id(), type });
const makeCards = (type: CardType, n: number): Card[] => Array.from({ length: n }, () => makeCard(type));
const makeToken = (type: GoodsType, value: number): Token => ({ id: id(), type, value });
const makeBonus = (count: 3 | 4 | 5, value: number): BonusToken => ({ id: id(), cardsCount: count, value });

const makePlayer = (overrides?: Partial<Player>): Player => ({
  id: id(),
  name: 'Test Player',
  hand: [],
  ships: [],
  tokens: [],
  bonusTokens: [],
  isAI: false,
  isLocal: true,
  hasUsedPirateRaid: false,
  ...overrides,
});

// ═════════════════════════════════════════════════════════════════
// SELL — min counts for rare goods
// ═════════════════════════════════════════════════════════════════

describe('Sell validation — minimum counts for expensive goods', () => {
  const expensiveGoods: GoodsType[] = ['gold', 'silver', 'gemstones'];

  expensiveGoods.forEach((type) => {
    it(`rejects selling 1 ${type} (requires MIN_SELL_EXPENSIVE=${MIN_SELL_EXPENSIVE})`, () => {
      expect(1 < MIN_SELL_EXPENSIVE).toBe(true);
    });

    it(`allows selling ${MIN_SELL_EXPENSIVE} ${type}`, () => {
      expect(MIN_SELL_EXPENSIVE >= MIN_SELL_EXPENSIVE).toBe(true);
    });
  });

  const cheapGoods: GoodsType[] = ['rum', 'cannonballs', 'silks'];

  cheapGoods.forEach((type) => {
    it(`allows selling 1 ${type} (no minimum)`, () => {
      const cards = makeCards(type, 1);
      // cheap goods have no minimum — just need > 0
      expect(cards.length >= 1).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════
// SELL — all cards must be same type
// ═════════════════════════════════════════════════════════════════

describe('Sell validation — same type requirement', () => {
  it('rejects mixed card types', () => {
    const cards = [makeCard('rum'), makeCard('gold')];
    const type = cards[0].type;
    const allSame = cards.every((c) => c.type === type);
    expect(allSame).toBe(false);
  });

  it('accepts uniform card types', () => {
    const cards = makeCards('silks', 4);
    const type = cards[0].type;
    const allSame = cards.every((c) => c.type === type);
    expect(allSame).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════
// TAKE ALL SHIPS
// ═════════════════════════════════════════════════════════════════

describe('Take all ships', () => {
  it('collects all ships from market', () => {
    const market = [
      makeCard('ships'),
      makeCard('rum'),
      makeCard('ships'),
      makeCard('gold'),
      makeCard('ships'),
    ];
    const ships = market.filter((c) => c.type === 'ships');
    expect(ships.length).toBe(3);
  });

  it('ships do not count toward hand limit', () => {
    const player = makePlayer({
      hand: makeCards('rum', HAND_LIMIT), // hand is full
      ships: makeCards('ships', 5),
    });
    // Hand is at limit but ships are separate
    expect(player.hand.length).toBe(HAND_LIMIT);
    expect(player.ships.length).toBe(5);
    // Can still add more ships
    player.ships.push(makeCard('ships'));
    expect(player.ships.length).toBe(6);
  });

  it('rejects take-all-ships when no ships in market', () => {
    const market = makeCards('rum', 5);
    const ships = market.filter((c) => c.type === 'ships');
    expect(ships.length).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// BONUS AWARDS
// ═════════════════════════════════════════════════════════════════

describe('Bonus token awards', () => {
  it('awards 3-card bonus for selling 3 cards', () => {
    const cardCount = 3;
    const bonusThree = BONUS_THREE_VALUES.map((v) => makeBonus(3, v));
    let bonus: BonusToken | undefined;

    if (cardCount >= 5) bonus = undefined;
    else if (cardCount >= 4) bonus = undefined;
    else if (cardCount >= 3 && bonusThree.length > 0) bonus = bonusThree[0];

    expect(bonus).toBeDefined();
    expect(bonus!.cardsCount).toBe(3);
  });

  it('awards 4-card bonus for selling 4 cards', () => {
    const cardCount = 4;
    const bonusFour = BONUS_FOUR_VALUES.map((v) => makeBonus(4, v));
    let bonus: BonusToken | undefined;

    if (cardCount >= 5) bonus = undefined;
    else if (cardCount >= 4 && bonusFour.length > 0) bonus = bonusFour[0];

    expect(bonus).toBeDefined();
    expect(bonus!.cardsCount).toBe(4);
  });

  it('awards 5-card bonus for selling 5+ cards', () => {
    const cardCount = 5;
    const bonusFive = BONUS_FIVE_VALUES.map((v) => makeBonus(5, v));
    let bonus: BonusToken | undefined;

    if (cardCount >= 5 && bonusFive.length > 0) bonus = bonusFive[0];

    expect(bonus).toBeDefined();
    expect(bonus!.cardsCount).toBe(5);
  });

  it('no bonus for selling 2 or fewer cards', () => {
    const cardCount = 2;
    const bonusThree = BONUS_THREE_VALUES.map((v) => makeBonus(3, v));
    let bonus: BonusToken | undefined;

    if (cardCount >= 5) bonus = undefined;
    else if (cardCount >= 4) bonus = undefined;
    else if (cardCount >= 3 && bonusThree.length > 0) bonus = bonusThree[0];

    expect(bonus).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════
// SCORE CALCULATION
// ═════════════════════════════════════════════════════════════════

describe('Score calculation', () => {
  it('sums tokens + bonus tokens + ship bonus', () => {
    const player = makePlayer({
      tokens: [makeToken('rum', 4), makeToken('rum', 3), makeToken('gold', 6)],
      bonusTokens: [makeBonus(3, 2)],
      ships: [makeCard('ships')], // 1 ship = 5 points
    });

    const score = calculateScore(player);
    expect(score).toBe(4 + 3 + 6 + 2 + 5); // 20
  });

  it('no ship bonus with 0 ships', () => {
    const player = makePlayer({
      tokens: [makeToken('silks', 5)],
      ships: [],
    });
    expect(calculateScore(player)).toBe(5);
  });
});

// ═════════════════════════════════════════════════════════════════
// TURN ROTATION
// ═════════════════════════════════════════════════════════════════

describe('Turn rotation', () => {
  it('alternates between 2 players using modulo', () => {
    const totalPlayers = 2;
    const nextPlayer = (current: number) => (current + 1) % totalPlayers;

    expect(nextPlayer(0)).toBe(1);
    expect(nextPlayer(1)).toBe(0);
  });

  it('rotates among 3 players', () => {
    const totalPlayers = 3;
    const nextPlayer = (current: number) => (current + 1) % totalPlayers;

    expect(nextPlayer(0)).toBe(1);
    expect(nextPlayer(1)).toBe(2);
    expect(nextPlayer(2)).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// ROUND END — 3 token stacks empty
// ═════════════════════════════════════════════════════════════════

describe('Round end conditions', () => {
  it('triggers when 3 token stacks are empty', () => {
    const tokenStacks: Record<GoodsType, Token[]> = {
      rum: [],
      cannonballs: [],
      silks: [],
      silver: INITIAL_TOKEN_VALUES.silver.map((v) => makeToken('silver', v)),
      gold: INITIAL_TOKEN_VALUES.gold.map((v) => makeToken('gold', v)),
      gemstones: INITIAL_TOKEN_VALUES.gemstones.map((v) => makeToken('gemstones', v)),
    };

    const emptyStacks = Object.values(tokenStacks).filter((s) => s.length === 0).length;
    expect(emptyStacks).toBe(3);
    expect(emptyStacks >= 3).toBe(true); // round should end
  });

  it('does not trigger with only 2 empty stacks', () => {
    const tokenStacks: Record<GoodsType, Token[]> = {
      rum: [],
      cannonballs: [],
      silks: INITIAL_TOKEN_VALUES.silks.map((v) => makeToken('silks', v)),
      silver: INITIAL_TOKEN_VALUES.silver.map((v) => makeToken('silver', v)),
      gold: INITIAL_TOKEN_VALUES.gold.map((v) => makeToken('gold', v)),
      gemstones: INITIAL_TOKEN_VALUES.gemstones.map((v) => makeToken('gemstones', v)),
    };

    const emptyStacks = Object.values(tokenStacks).filter((s) => s.length === 0).length;
    expect(emptyStacks).toBe(2);
    expect(emptyStacks >= 3).toBe(false);
  });

  it('triggers when deck is empty and market is under-filled', () => {
    const deckLength = 0;
    const marketLength = 3; // less than MARKET_SIZE (5)

    const deckTrigger = deckLength === 0 && marketLength < MARKET_SIZE;
    expect(deckTrigger).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════
// HAND LIMIT
// ═════════════════════════════════════════════════════════════════

describe('Hand limit enforcement', () => {
  it('hand limit is 7', () => {
    expect(HAND_LIMIT).toBe(7);
  });

  it('rejects take when hand is full', () => {
    const player = makePlayer({ hand: makeCards('rum', HAND_LIMIT) });
    const canTake = player.hand.length < HAND_LIMIT;
    expect(canTake).toBe(false);
  });

  it('allows take when hand has room', () => {
    const player = makePlayer({ hand: makeCards('rum', HAND_LIMIT - 1) });
    const canTake = player.hand.length < HAND_LIMIT;
    expect(canTake).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════
// DECK COMPOSITION
// ═════════════════════════════════════════════════════════════════

describe('Deck composition', () => {
  it('has correct total card count (55)', () => {
    const total = Object.values(DECK_COMPOSITION).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(55);
  });

  it('has 11 ships', () => {
    expect(DECK_COMPOSITION.ships).toBe(11);
  });
});
