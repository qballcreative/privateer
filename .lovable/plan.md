

## Screenshot-Based Tutorial — Implementation Plan

### Root Cause
`TutorialPage` calls `startGame()` which mutates the shared game store, setting `phase` to `'playing'`. This causes `Index.tsx` to render the full `GameBoard` instead of `LandingPage` when navigating back, and can trigger AI turns and other side effects.

### Approach

**Step 1: Capture 3 screenshots via browser automation**
- Navigate to the preview, start a game manually, then capture screenshots at:
  - Mobile: 375×812
  - Tablet: 768×1024  
  - Desktop: 1280×800
- Save as `public/images/tutorial/game-mobile.png`, `game-tablet.png`, `game-desktop.png`

**Step 2: Rewrite `TutorialPage.tsx` — pure image + hotspot overlays**
- Remove ALL game store dependencies (`startGame`, `resetGame`, component imports)
- Show the viewport-appropriate screenshot image (responsive via media query / `useIsMobile`)
- Image is scrollable, fills width
- Overlay transparent `div` elements positioned as percentage-based hotspots over each region:
  - `tutorial-trading-post`, `tutorial-ships-hold`, `tutorial-market-prices`, `tutorial-bonus`, `tutorial-actions`, `tutorial-storm`, `tutorial-raid`, `tutorial-treasure`
- Each hotspot div carries the corresponding `data-tutorial-id`
- Three sets of percentage coordinates (mobile/tablet/desktop)
- Keep header with logo + Skip button (with `pointer-events-auto`)

**Step 3: No changes needed to `Tutorial.tsx` or `tutorialStore.ts`**
- The spotlight system already works with `data-tutorial-id` + `getBoundingClientRect()` — it will find the hotspot divs just fine
- Scroll listeners already in place

### Files

| File | Action |
|------|--------|
| `public/images/tutorial/game-mobile.png` | **Create** via browser screenshot |
| `public/images/tutorial/game-tablet.png` | **Create** via browser screenshot |
| `public/images/tutorial/game-desktop.png` | **Create** via browser screenshot |
| `src/pages/TutorialPage.tsx` | **Rewrite** — image-based, no game store |

### Hotspot coordinate tuning
The percentage-based positions will need adjustment after seeing the screenshots. I'll set initial estimates based on the known game layout, then we can refine.

