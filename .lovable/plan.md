

## Tutorial Highlight Fix

### Problems Identified

1. **Steps 2-3 (Trading Post, Actions):** The `tutorial-actions` div only renders when `isPlayerTurn && phase === 'playing'`. If the tutorial fires before the player's turn is confirmed, the element doesn't exist in the DOM — no highlight appears.

2. **Steps 4-5 (Ship's Hold, Sell Cargo):** On phone layout, the Ship's Hold is wrapped in an `AnimatePresence` that hides it when `isExchangeMode` is true. If the mode state is wrong, the element is unmounted.

3. **Steps 6-7 (Market Prices, Commission Seals):** On phone layout, these elements live inside a Sheet drawer that is closed by default. The `data-tutorial-id` elements are not in the visible DOM, so `querySelector` returns null and no highlight renders.

4. **Tooltip positioning covers the highlighted area:** The current logic uses `step.position` (e.g. `right`) which can place the tooltip directly over the highlighted element, especially on narrow viewports.

### Plan

#### 1. Tutorial-aware element visibility (Tutorial.tsx)
- When a step has a `highlightId`, check if the element exists in the DOM. If not, attempt to reveal it:
  - For `tutorial-market-prices` and `tutorial-bonus`: programmatically open the treasure drawer by dispatching a callback
  - For `tutorial-actions`: always render the actions div (even if dimmed) during tutorial, or move `data-tutorial-id` to a parent that's always visible
- Add a retry mechanism: if the element isn't found after the first attempt, wait 300ms and retry (up to 3 times) to handle animation delays.

#### 2. Auto-open drawers during tutorial (PhoneLayout.tsx)
- Accept a prop or use the tutorial store directly in PhoneLayout to auto-open `treasureDrawerOpen` when the current tutorial step targets `tutorial-market-prices` or `tutorial-bonus`.
- Ensure `tradingPostCollapsed` is forced to `false` when tutorial targets `tutorial-trading-post` or `tutorial-actions`.
- Ensure `isExchangeMode` doesn't hide the hold during tutorial steps targeting `tutorial-ships-hold`.

#### 3. Always render action buttons during tutorial (TradingPost.tsx)
- Change the conditional `{isPlayerTurn && phase === 'playing' && (` to also render when the tutorial is active and current step targets `tutorial-actions`. The buttons can be visually dimmed but must exist in the DOM.

#### 4. Fix tooltip positioning logic (Tutorial.tsx)
- Replace the current `step.position` system with a simpler two-option approach:
  - **Primary:** Place the highlighted element at the top of the viewport (scroll to `block: 'start'`), tooltip below it
  - **Fallback:** If not enough room below (element is near bottom), scroll to `block: 'end'` and place tooltip above
- Remove `left`/`right` positioning options — always place tooltip vertically relative to the highlighted element, horizontally centered and viewport-clamped

#### 5. Remove `position` field from tutorial steps (tutorialStore.ts)
- Remove all `position` properties from `TUTORIAL_STEPS` since positioning will now be automatic (below if possible, above if not).

### Files to modify
- `src/components/game/Tutorial.tsx` — retry logic, new positioning algorithm
- `src/store/tutorialStore.ts` — remove `position` fields
- `src/components/game/TradingPost.tsx` — always render action buttons during tutorial
- `src/components/game/layouts/PhoneLayout.tsx` — auto-open drawers/sections during tutorial steps
- `src/components/game/layouts/types.ts` — if new props needed

