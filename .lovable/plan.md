

## Track 2: Game Polish Improvements

Focusing on three areas identified in the review: Victory Screen, Sound Completeness, and Mobile Layout. Ads deferred to a later phase.

---

### 2A. Victory Screen — New Component

**Current state**: The `gameEnd` phase shows a basic modal with a Trophy icon, winner name, and a single "Return to Port" button. No score breakdown, no celebratory effects.

**Plan**: Extract a dedicated `VictoryScreen.tsx` component with:

- **Score breakdown** for each player: doubloons from tokens, bonus tokens, fleet bonus (5 pts) — itemized in a parchment-styled card
- **Voyage scoreboard**: Show which player won each of the 3 voyages (using `roundWins` array)
- **Treasure chest animation**: Trophy icon scales up with a spring, then gold particle dots drift down using Framer Motion staggered children
- **Confetti effect**: Simple CSS/Framer gold sparkle particles (no new dependency) — 20-30 small gold circles that fall and fade
- **"Play Again" button** alongside "Return to Port"
- Uses existing `calculateScore` helper to break down scoring

| File | Change |
|------|--------|
| `src/components/game/VictoryScreen.tsx` | New — full victory overlay component |
| `src/components/game/GameBoard.tsx` | Replace inline `gameEnd` modal (lines 1112-1153) with `<VictoryScreen />` |

---

### 2B. Sound Completeness Audit

**Current state**: `useGameAudio.ts` maps action types to sound files. The `GameBoard` calls `playActionSound` on `lastAction` changes and `playSound` for phase transitions.

**Gaps identified**:
- Sell action triggers `playActionSound` via `lastAction`, which maps to `coin-collect.mp3` — this works
- Round win/lose and game win/lose are handled in the phase-change effect — this works
- **Missing**: No distinct sound when the player clicks UI buttons (take/exchange confirm) vs when the action resolves. Currently only the resolved action triggers sound, which is correct.
- `game-lose` maps to `/sounds/defeat-horn.mp3` which doesn't exist in the sounds directory — needs fallback to `defeat.mp3`

| File | Change |
|------|--------|
| `src/hooks/useGameAudio.ts` | Change `game-lose` URL from `defeat-horn.mp3` to `defeat.mp3` |

---

### 2C. Mobile Layout Density

**Current state**: Phone layout uses Sheet drawers for Treasure Supply and Opponent. Trading Post is collapsible. Ship's Hold sits below.

**Improvements**:
- Add a **cargo count badge** on the Opponent drawer trigger showing their hand size (e.g., "5/7")
- Add **score badges** on both drawer triggers so key info is visible without opening drawers
- Reduce Trading Post card sizes on phone for better density
- Show a **mini scoreboard bar** above the drawer triggers with each player's current doubloon total, so the player doesn't need to open the opponent drawer just to check scores

| File | Change |
|------|--------|
| `src/components/game/GameBoard.tsx` | Add score badges to drawer triggers, add mini score bar for phone layout |

---

### Implementation order

1. Fix `game-lose` sound path (2B) — 1 line
2. Build `VictoryScreen.tsx` and wire it in (2A) — main effort
3. Mobile layout improvements (2C) — UI polish

