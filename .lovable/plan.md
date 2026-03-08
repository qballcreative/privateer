

# Fix Overlapping Tokens in Trading Post

## Problem
The cargo tokens overlap after trades because:
1. `CargoObject` uses fixed square containers (`w-16 h-16`) but the token images are portrait-oriented (taller than wide). With `object-contain`, the visible image is narrower than the container, but layout animations don't account for this properly.
2. The `LayoutGroup` + `layout` prop causes framer-motion to animate positions during exchanges, and items can land on overlapping coordinates when old items exit and new items enter simultaneously.

## Solution

### `src/components/game/CargoObject.tsx`
- Remove fixed height from `sizeClasses` — let images determine their own height via aspect ratio
- Change to width-only sizing: `sm: 'w-14'`, `md: 'w-20'`, `lg: 'w-24'`
- This ensures each flex item's width matches the actual visible image width, so flex gap works correctly

### `src/components/game/TradingPost.tsx`
- Change `AnimatePresence mode="popLayout"` to `mode="sync"` — `popLayout` removes items from flow immediately causing position jumps that create overlaps
- Increase gap from `gap-3 sm:gap-4` to `gap-4 sm:gap-6` for more breathing room
- Add `items-end` to align tokens along their base (since heights will vary slightly)

