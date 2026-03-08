

## Problem

When the player enters **Exchange/Trade Goods** mode in the Trading Post, a new card selection area opens showing their hand and ships. But the **Captain's Hold** remains fully visible and interactive below it, creating two clickable areas with the same cards -- confusing and error-prone.

Additionally, in the exchange panel, cargo and ships are mixed together on a single line instead of being visually separated.

## Recommendation

**Hide the Captain's Hold when exchange mode is active.** This is the cleanest approach because:
- The exchange panel already shows the player's full hand + ships for selection
- Having both open creates duplicate interactive zones
- Collapsing the hold draws focus to the trade interaction

## Plan

### 1. Expose exchange mode from TradingPost

TradingPost currently manages `mode` as internal state. We need to surface it so GameBoard can react:

- Add an `onModeChange?: (mode: 'take' | 'exchange') => void` prop to `TradingPost`
- Call `onModeChange` whenever `mode` changes (in the button clicks and after completing/canceling exchange)

### 2. GameBoard hides Captain's Hold during exchange

- Add state `const [isExchangeMode, setIsExchangeMode] = boolean` in GameBoard
- Pass `onModeChange={setIsExchangeMode}` (mapped to boolean) to all `<TradingPost>` instances
- Wrap the `<ShipsHold>` for the human player in all three layouts (phone, tablet, desktop) with a condition: hide/collapse when `isExchangeMode` is true
- Use `AnimatePresence` + `motion.div` for a smooth collapse animation

### 3. Separate cargo and ships on two lines in exchange panel

In `TradingPost.tsx`, the exchange section (lines 284-327) renders `currentPlayer.hand` and `currentPlayer.ships` in a single flex container. Change to:

- **Line 1 (Cargo)**: `currentPlayer.hand` items in a flex-wrap row
- **Line 2 (Ships)**: `currentPlayer.ships` items in a flex-wrap row, with a subtle label/divider like "Ships" between them

### Files to modify
- `src/components/game/TradingPost.tsx` -- add `onModeChange` prop, split cargo/ships into two rows
- `src/components/game/GameBoard.tsx` -- track exchange mode, conditionally hide ShipsHold in all 3 layouts

