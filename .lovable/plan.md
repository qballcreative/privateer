

# Fix Overlapping Cargo in Captain's Hold

## Problem
Same root cause as the Trading Post overlap we fixed earlier: `AnimatePresence mode="popLayout"` removes exiting items from document flow immediately, causing entering items to animate into positions that overlap with remaining items. The `gap-2` spacing is also too tight.

## Solution

### `src/components/game/ShipsHold.tsx`
- Line 134: Change `AnimatePresence mode="popLayout"` to `mode="sync"` — keeps exiting items in flow until fully gone, preventing position collisions
- Line 131: Increase desktop gap from `gap-2` to `gap-4` and add `items-end` for consistent baseline alignment
- Line 130: Increase phone gap from `gap-2` to `gap-3`

Single file, three small class/prop changes.

