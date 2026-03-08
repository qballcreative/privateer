

## Tutorial Overlay Redesign: Full Mock Game Screen

### Problem
Currently the tutorial highlights elements on the HowToPlay page's mock board at the bottom. The user wants the tutorial to load a **full-screen mock game board** (resembling the actual game layout) and spotlight areas using a dim overlay, with no scrolling affecting the highlight. On completion, navigate back to the landing page.

### Approach

**1. New dedicated tutorial page (`src/pages/TutorialPage.tsx`)**
- A new route `/tutorial` that renders a static, non-interactive replica of the `GameBoard` layout (Trading Post, Ship's Hold, Market Prices, Commission Seals, optional rules indicators)
- Uses the same wood background, pirate fonts, and layout structure as the real game
- All sections tagged with `data-tutorial-id` attributes
- Page has `overflow-hidden` and `h-screen` so no scrolling occurs
- The `Tutorial` overlay component renders on top
- Tutorial auto-starts when page loads
- On tutorial complete/skip → `navigate('/')`

**2. Update `Tutorial.tsx`**
- Accept an `onComplete` callback prop (for navigation)
- Use `position: fixed` coordinates relative to viewport (already does this) — no scroll issues since the page won't scroll
- Keep the existing spotlight clip-path and tooltip logic

**3. Update `tutorialStore.ts`**
- Add an `onComplete` callback field, called when tutorial ends (next on last step, skip, or complete)
- Or simpler: just have TutorialPage watch `isActive` and navigate when it goes false

**4. Update routes & navigation**
- Add `/tutorial` route in `App.tsx`
- HowToPlay "Start Tutorial" button → `navigate('/tutorial')` instead of calling `startTutorial` inline
- Settings panel "How to Play" link stays as-is
- Remove `TutorialMockBoard` from HowToPlay page (no longer needed there)
- Remove `<Tutorial />` from HowToPlay page

**5. Mock game board layout in TutorialPage**
- Simplified static version of GameBoard with:
  - Header with banner logo
  - Trading Post area with 5 sample cargo cards (rum, gold, silk, ships, iron)
  - Market Prices with 6 token stacks
  - Ship's Hold with 4 goods + 3 empty slots
  - Commission Seals (3 seal images)
  - Optional rules indicators (storm, raid, treasure)
  - Opponent area (face-down cards)
- All fit on one viewport height with no scroll (`h-screen overflow-hidden`)
- Each section has appropriate `data-tutorial-id`

### Files

| File | Action |
|------|--------|
| `src/pages/TutorialPage.tsx` | **Create** — full-screen mock game board + Tutorial overlay |
| `src/components/game/Tutorial.tsx` | **Modify** — watch `isActive` becoming false to call `onComplete` callback |
| `src/pages/HowToPlay.tsx` | **Modify** — remove TutorialMockBoard, change Start Tutorial to navigate to `/tutorial` |
| `src/App.tsx` | **Modify** — add `/tutorial` route |
| `src/store/tutorialStore.ts` | **Modify** — minor: clean up step positions for new layout |

