

## Tutorial System — Full Rewrite

### Root Causes

1. **Dark overlay with cutout not appearing**: The `clip-path: polygon(...)` approach is fragile — if the element isn't found immediately (350ms delay may not be enough), `highlightRect` stays `null` and the backdrop renders as a full black overlay with no cutout. Also, `clip-path` polygon syntax can fail silently on some browsers.

2. **Tooltip not anchored properly**: The tooltip positioning calculates on the first render before `tooltipRef.current` has actual height, so the initial position is wrong. The `AnimatePresence mode="wait"` also delays the tooltip mount, meaning the ref is stale.

3. **Page "rebuilding" feel**: `scrollIntoView` triggers layout shifts. On desktop/tablet, the target elements are already visible (no drawers), so scrolling is unnecessary and disorienting.

4. **Elements not found in DOM**: On phone, the treasure drawer Sheet unmounts its children when closed. The `tutorial-step` custom event is dispatched but nothing listens to it on desktop/tablet layouts (only PhoneLayout has the auto-open logic). The `useTutorialStore.getState()` call inside TradingPost's render is not reactive — it reads stale state.

### Redesign Approach

Replace the current system with a simpler, more robust overlay that uses **four overlay rectangles** instead of `clip-path` (works everywhere), measures tooltip height after mount via `useLayoutEffect`, and only scrolls on mobile when needed.

### Changes

#### 1. `src/components/game/Tutorial.tsx` — Full rewrite

- **Backdrop**: Instead of `clip-path`, render 4 `<div>` rectangles (top, bottom, left, right) around the highlight target. This is the standard "spotlight" pattern — simple CSS, works on every browser.
- **Element finding**: Use a `useLayoutEffect` + `setTimeout` retry loop (up to 1500ms in 100ms intervals). Once found, lock the rect and stop polling. Re-run on step change.
- **Tooltip positioning**: Use a two-pass approach:
  1. First render: place tooltip offscreen to measure its height via ref
  2. `useLayoutEffect` reads the actual height, then positions above or below the highlight with viewport clamping
- **Scrolling**: Only scroll if the element's bounding rect is fully outside the viewport. Use `scrollIntoView({ block: 'center', behavior: 'smooth' })` once per step, then re-measure after a short delay.
- **No RAF polling**: Replace continuous RAF with a one-shot measurement per step. Add a single `resize` listener to re-measure if the window resizes during tutorial.

#### 2. `src/components/game/TradingPost.tsx` — Fix reactive tutorial check

- Replace `useTutorialStore.getState()` (non-reactive) with `useTutorialStore()` hook subscription so the actions div re-renders when tutorial step changes.

#### 3. `src/components/game/layouts/DesktopLayout.tsx` and `TabletLayout.tsx`

- Add the same forced-visibility logic as PhoneLayout: when tutorial is active and targets `tutorial-ships-hold`, don't hide the hold even if `isExchangeMode` is true.

#### 4. `src/store/tutorialStore.ts` — No changes needed (already clean)

### Files to modify
- `src/components/game/Tutorial.tsx` — full rewrite with 4-rect backdrop, retry element finder, two-pass tooltip positioning
- `src/components/game/TradingPost.tsx` — make tutorial state reactive
- `src/components/game/layouts/DesktopLayout.tsx` — force hold visible during tutorial
- `src/components/game/layouts/TabletLayout.tsx` — force hold visible during tutorial

