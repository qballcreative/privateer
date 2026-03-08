

## Problem

Assets and animations reload every turn because:

1. **`TreasureSupplyPanel` is an inline component** defined inside `GameBoard`'s render function (line 321). React sees a new component identity every render, causing full unmount/remount of the entire Market Prices panel — including all images and animations.

2. **`TreasureStack` replays mount animations** — every doubloon coin uses `initial={{ scale: 0, y: -20 }}` which re-triggers whenever the component remounts due to #1.

3. **`ScoreBoard` replays entry animations** — each player card has `initial={{ opacity: 0, x: -20 }}` that re-fires on every remount.

4. **`BonusTokens` / `MedallionStack` replays scale animations** — same pattern with `initial={{ scale: 0 }}`.

5. **Background images** in `TradingPost`, `ShipsHold`, and `TreasureSupplyPanel` use inline `style={{ backgroundImage }}` which can trigger re-fetches on remount.

## Plan

### 1. Extract `TreasureSupplyPanel` and `OpponentPanel` out of GameBoard

Move these from inline functions (lines 321-392 and 395-408) to either:
- Stable `useCallback`-memoized renderers, or
- Separate memoized components defined outside `GameBoard`.

This is the **single biggest fix** — it stops the entire treasure/opponent section from remounting every turn.

### 2. Preload static images at module level

Create a small image preloader in `GameBoard.tsx` (or a shared util) that eagerly loads all static game images on first import:

```typescript
const preloadImages = [
  '/images/doubloons.png', '/images/commissions.png', '/images/fleet.png',
  '/images/supply.png', '/images/ledger-bg.png', '/images/trading-post-bg.png',
  '/images/cargo-hold-bg.png', '/images/wood-bg.png',
  '/Icons/Doubloon.png', '/Icons/rum.png', '/Icons/cannonballs.png',
  '/Icons/silks.png', '/Icons/silver.png', '/Icons/gold.png', '/Icons/gemstones.png',
  '/Icons/RedSeal.png', '/Icons/SilverSeal.png', '/Icons/GoldSeal.png',
  '/Icons/Claim.png', '/Icons/Trade.png',
];
preloadImages.forEach(src => { new Image().src = src; });
```

### 3. Use `React.memo` on stable child components

Wrap `TreasureStack`, `BonusTokens`, `ScoreBoard` in `React.memo` so they skip re-renders when their props haven't changed.

### 4. Remove re-mount animations from static panels

In `TreasureStack`, `ScoreBoard`, and `BonusTokens`, change `initial` to `false` or remove entry animations for elements that persist across turns (doubloon stacks, player cards, seal stacks). Only animate when values actually change — the `TickingScore` pattern already does this correctly.

### Files changed

- **`src/components/game/GameBoard.tsx`** — extract `TreasureSupplyPanel` and `OpponentPanel` to stable memoized components; add image preloader
- **`src/components/game/TreasureStack.tsx`** — wrap in `React.memo`; remove mount animations from persistent doubloons (use `layout` animation instead of `initial`)
- **`src/components/game/ScoreBoard.tsx`** — wrap in `React.memo`; set `initial={false}` on player cards
- **`src/components/game/BonusTokens.tsx`** — wrap in `React.memo`; set `initial={false}` on persistent seals

