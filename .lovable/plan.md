

## Tutorial: Real Game Board with Scroll-Safe Highlights

### Problem
The tutorial page uses a simplified mock board that doesn't look like the actual game. The user wants the tutorial to render the **real game components** (TradingPost, ShipsHold, ScoreBoard, Market, BonusTokens) so it looks identical to the actual game. Scrolling should be allowed but shouldn't break the highlight overlay.

### Approach

**1. Rewrite `TutorialPage.tsx` to use actual game components**

- On mount, call `startGame('Captain', 'easy', { stormRule: true, pirateRaid: true, treasureChest: true })` to populate the game store with real starting state
- Render the same 3-layout structure as `GameBoard.tsx` (phone/tablet/desktop grids) using the actual components: `TradingPost`, `ShipsHold`, `ScoreBoard`, `BonusTokens`, `TreasureStack`
- Wrap each section with `data-tutorial-id` divs for the spotlight system
- Use `pointer-events-none` on the entire board so nothing is interactive
- Remove `overflow-hidden` to allow scrolling
- On unmount, call `resetGame()` to clean up store state
- Keep the header with banner logo + a "Skip Tutorial" button

**2. Update `Tutorial.tsx` to handle scroll**

- Add a `scroll` event listener (alongside the existing `resize` listener) so `getBoundingClientRect()` is recalculated as the user scrolls
- The overlay already uses `position: fixed` with viewport-relative coords from `getBoundingClientRect()`, so highlight positions will stay correct as long as we recalculate on scroll
- When a step targets an element that's off-screen, auto-scroll the element into view using `scrollIntoView({ behavior: 'smooth', block: 'center' })`

**3. Responsive layouts match the game exactly**

Since we render the actual components, the phone layout gets the same stacked view with drawer trigger buttons, the tablet gets the 3-column grid, and desktop gets the 4-column grid — identical to GameBoard.

### Files

| File | Action |
|------|--------|
| `src/pages/TutorialPage.tsx` | **Rewrite** — render actual game components in GameBoard's layout with `data-tutorial-id` wrappers, `pointer-events-none`, scrollable |
| `src/components/game/Tutorial.tsx` | **Modify** — add scroll listener, auto-scroll highlighted elements into view |

