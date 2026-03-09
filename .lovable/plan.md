

## Tablet Layout Refactor — Consistent Drawer Pattern

### Overview
Refactor TabletLayout to use the same Sheet-based drawer pattern as PhoneLayout, including the tutorial auto-open logic.

### Changes

**File: `src/components/game/layouts/TabletLayout.tsx`**

1. **Replace 3-column grid** with main content area + side-sheet drawers
2. **Add state & tutorial logic** (same as PhoneLayout):
   - Import `useTutorialStore`, `TUTORIAL_STEPS`, and step constants from `Tutorial.tsx`
   - Add `useEffect` to auto-open drawers when tutorial targets elements inside them
   - Adjust the screen width check from `>= 768` to `>= 1024` (tablet range is 768-1023)
3. **Structure**:
   - Mini scoreboard bar at top
   - Drawer trigger buttons (Treasure left, Opponent right)
   - Left Sheet: `TreasureSupplyPanel` (width `w-[60vw] max-w-md`)
   - Right Sheet: `OpponentPanel` or Opponent's Hold + ScoreBoard (width `w-[60vw] max-w-md`)
   - Main: Collapsible TradingPost + Player's ShipsHold
4. **Use existing props**: `treasureDrawerOpen`, `setTreasureDrawerOpen`, `opponentDrawerOpen`, `setOpponentDrawerOpen`, `tradingPostCollapsed`, `setTradingPostCollapsed` already passed via `LayoutProps`

### Tutorial Integration

Add useEffect mirroring PhoneLayout but for tablet breakpoint:
```typescript
useEffect(() => {
  if (!tutorialActive || !currentHighlightId) return;
  // Only run on tablet-sized screens (768-1023px)
  if (window.innerWidth < 768 || window.innerWidth >= 1024) return;

  if (TREASURE_DRAWER_STEPS.includes(currentHighlightId)) {
    setTreasureDrawerOpen(true);
  }
  if (TRADING_POST_STEPS.includes(currentHighlightId)) {
    setTradingPostCollapsed(false);
  }
}, [tutorialActive, currentHighlightId]);
```

### Files to Modify
| File | Change |
|------|--------|
| `src/components/game/layouts/TabletLayout.tsx` | Complete rewrite to use Sheet drawers, add tutorial auto-open logic |

