

## Screenshot-Based Tutorial

### Problem
The current tutorial tries to render actual game components but many `data-tutorial-id` targets (claim, commandeer, trade, sell) don't exist as standalone elements, causing steps to break. Rendering a full game also adds complexity.

### Approach: Static Screenshot Images with Positioned Hotspot Overlays

**1. Capture 3 screenshots of the real game board**
- I'll use browser automation to start a game in the preview, then capture screenshots at mobile (375px), tablet (768px), and desktop (1280px) viewports
- Save as `public/images/tutorial/game-mobile.png`, `game-tablet.png`, `game-desktop.png`

**2. Rewrite `TutorialPage.tsx` to be image-based**
- Show the appropriate screenshot image based on viewport (using `useIsMobile` + a tablet breakpoint check)
- The image fills the viewport width, scrollable vertically
- Overlay transparent absolutely-positioned `<div>` elements with `data-tutorial-id` attributes over each region of the screenshot (Trading Post, Ship's Hold, Market Prices, Commission Seals, action buttons area, optional rules icons)
- Hotspot positions defined as percentage-based coordinates (top/left/width/height as % of image) for each device size — 3 sets of coordinates

**3. Update tutorial steps**
- Action steps (claim, commandeer, trade, sell) all highlight the Trading Post area since that's where actions happen in the real game
- Remove step IDs that don't map to real regions, or merge them to point at the Trading Post

**4. No game store dependency**
- Remove `startGame`/`resetGame` calls — no game state needed
- Page is purely: image + positioned hotspot divs + Tutorial overlay

### Files

| File | Action |
|------|--------|
| `public/images/tutorial/game-mobile.png` | **Create** — screenshot capture |
| `public/images/tutorial/game-tablet.png` | **Create** — screenshot capture |
| `public/images/tutorial/game-desktop.png` | **Create** — screenshot capture |
| `src/pages/TutorialPage.tsx` | **Rewrite** — image-based with hotspot overlays |
| `src/store/tutorialStore.ts` | **Modify** — update action step highlight targets |

### Tradeoff
The hotspot positions will need manual tuning since they're percentage-based coordinates mapped to the screenshots. If the game layout ever changes, new screenshots + updated coordinates would be needed.

