

## Combined Implementation: AI Thinking Message + Third Review Improvements

### Changes Overview

**8 items across 9 files** — implementing the themed AI thinking message plus all Priority A and B improvements from the third review. Deferring C1 (undo) as agreed.

---

### 1. AI Thinking Message (line 757 in GameBoard.tsx)
Replace `'Pirate AI is thinking...'` with `\`${opponentName || 'The Captain'} is pondering their next move...\``
- `opponentName` is already available in the component

### 2. Wire `bestOf` and `firstPlayer` to game store (A1 + A2)
- **`gameStore.ts`**: Change `startGame` signature to accept `maxRounds` and `firstPlayer` params. Use `maxRounds` instead of hardcoded `3`. If `firstPlayer === 'random'`, set `currentPlayerIndex` to `secureRandomInt(2)`.
- **`LandingPage.tsx`**: Pass `bestOf` and `firstPlayer` to `startGame(name, difficulty, rules, bestOf, firstPlayer)`

### 3. Track per-round winners (A3)
- **`types/game.ts`**: Add `roundWinners: (string | null)[]` to `GameState`
- **`gameStore.ts`**: In `endTurn` where round ends, push `winner?.id || null` to `roundWinners`. Initialize as `[]` in `startGame`. Reset in `nextRound`.
- **`VictoryScreen.tsx`**: Accept `roundWinners` prop, render the existing `VoyageIndicator` component using the per-round data

### 4. Player name input (B1)
- **`SetSailPanel.tsx`**: Add `playerName` and `onNameChange` props. Add a text input field above the mode selector.
- **`LandingPage.tsx`**: Change `playerName` from `useState` with no setter to `useState` with setter. Pass to `SetSailPanel`.

### 5. Player stats display (B2)
- **`SetSailPanel.tsx`**: Add `stats` prop. Show a small stats row (W-L, win rate %) below the player name input.

### 6. Extract `getScoreBreakdown` (B3)
- **New `src/lib/scoring.ts`**: Move `getScoreBreakdown` here, export it
- **`VictoryScreen.tsx`** and **`RoundEndModal.tsx`**: Import from `@/lib/scoring`

### 7. Themed loading screen (B4)
- **`Index.tsx`**: Replace plain text fallback with a styled loading screen using the logo, a pulsing anchor icon, and the existing bg/text classes

---

### Files to modify/create

| File | Action |
|------|--------|
| `src/lib/scoring.ts` | New — shared `getScoreBreakdown` |
| `src/types/game.ts` | Add `roundWinners` field |
| `src/store/gameStore.ts` | Wire `bestOf`, `firstPlayer`, `roundWinners` |
| `src/components/game/GameBoard.tsx` | AI thinking message |
| `src/components/game/LandingPage.tsx` | Player name state + pass bestOf/firstPlayer |
| `src/components/game/SetSailPanel.tsx` | Name input + stats display |
| `src/components/game/VictoryScreen.tsx` | Use shared scoring, render VoyageIndicators |
| `src/components/game/RoundEndModal.tsx` | Use shared scoring |
| `src/pages/Index.tsx` | Themed loading fallback |

