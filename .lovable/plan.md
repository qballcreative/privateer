

## Plan: Fix cargo misalignment after trade/exchange

### Problem
After an exchange, the first cargo icon renders outside the hold boundary. The exchange entry animation uses `x: -60` which, combined with `layout="position"` from Framer Motion's LayoutGroup, causes items to settle at incorrect positions — the layout animation fights the flex container's natural positioning.

### Solution
Two changes in `src/components/game/ShipsHold.tsx`:

1. **Remove `layout="position"` from cargo items** (line 147) — this is the main culprit. LayoutGroup's position tracking gets confused when items are swapped during exchanges, causing stale position calculations. The `AnimatePresence` entry/exit animations are sufficient.

2. **Remove the x-offset from exchange animations** (lines 149-150, 155-156) — use the same `slideIntoSlot` animation for all actions. The directional slide (`x: -60` in, `x: 60` out) adds visual noise and contributes to misalignment. A simple fade+scale from above is cleaner and doesn't risk positioning artifacts.

### Changes in `src/components/game/ShipsHold.tsx`

- **Line 147**: Remove `layout="position"` prop entirely
- **Lines 148-158**: Simplify to always use `slideIntoSlot.initial` / `slideIntoSlot.exit` regardless of `wasExchange`
- **Line 142**: Remove `<LayoutGroup>` wrapper (no longer needed without layout animations)
- Remove `LayoutGroup` from imports

### Files to modify
- `src/components/game/ShipsHold.tsx`

