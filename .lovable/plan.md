
## Problem

`getTooltipStyle()` in `Tutorial.tsx` positions the tooltip card using raw pixel coordinates from `highlightRect` but never checks if those coordinates push the card off-screen. On narrow phones (≤375px) this causes:

- `bottom` / `top` positions: the `left` value (center of the highlighted element) minus half the card width (160px) can go negative, or the right edge can overflow past `window.innerWidth`.
- `right` position: `highlightRect.right + 16` can push the card past the viewport right edge.
- `left` position: `window.innerWidth - highlightRect.left + 16` used as `right` CSS property can be off.
- Vertical: `bottom` placement where `highlightRect.bottom + 16` is near the keyboard/bottom nav can overflow.

The tooltip is `w-80` (320px) with `max-w-[calc(100vw-2rem)]` which shrinks the width correctly, but the **anchor point** (left/top) is still unclamped.

## Fix — Single file: `src/components/game/Tutorial.tsx`

Replace `getTooltipStyle()` with a clamped version that:

1. Computes the "ideal" pixel position for each side.
2. For horizontal positions (top/bottom): clamps `left` so the card stays `8px` from each edge. Instead of using `transform: translateX(-50%)` with an unclamped left value, compute the actual `left` pixel value after centering, then clamp it:
   ```
   const tooltipW = Math.min(320, window.innerWidth - 16);
   let idealLeft = highlightRect.left + highlightRect.width / 2 - tooltipW / 2;
   const clampedLeft = Math.max(8, Math.min(idealLeft, window.innerWidth - tooltipW - 8));
   ```
   Return `{ top/bottom: ..., left: clampedLeft + 'px' }` with **no transform** (since we pre-computed center).

3. For vertical positions (left/right): clamp `top` so the card stays in the viewport vertically.

4. Add a vertical overflow guard: if `bottom` placement would push below `window.innerHeight - 8`, flip to `top` placement automatically (and vice versa). This prevents the tooltip going under the mobile browser chrome.

5. Keep the existing `max-w-[calc(100vw-2rem)]` class on the motion div as a CSS safety net.

## Changes

**Only `src/components/game/Tutorial.tsx`** — replace the `getTooltipStyle` function body (~35 lines).

The logic is self-contained; no store, no other component needs touching.
