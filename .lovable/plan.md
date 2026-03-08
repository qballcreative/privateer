
## Evaluation: Privateer — What Needs To Be Done

After a full audit of every major file in the codebase, here is an honest assessment of what's working and what's missing or broken.

---

### CONFIRMED BUG: "Return to Port" Quit Does Not Record a Loss

**Line 499 of `GameBoard.tsx`:**
```tsx
<AlertDialogAction onClick={resetGame} className="...">
  Return to Port
</AlertDialogAction>
```
`resetGame` is called directly without first calling `recordGameResult(false)`. This was the originally reported bug and it is still unresolved. The fix is one line — wrap it in an inline handler.

---

### Issues Found

**1. Quit mid-game = no loss recorded (the bug)**
- The Home button → "Return to Port" confirm dialog calls `resetGame` directly.
- `recordGameResult(false)` is never called when a player quits mid-game via the Home button.
- The automatic loss recording only fires on `gameEnd` phase, not on early quit.
- Only single-player games should count (multiplayer quits are handled by DisconnectModal separately).

**2. "Return to Port" on VictoryScreen also bypasses stat recording**
- `VictoryScreen.tsx` line 239: `onReturnHome` calls `resetGame` via `GameBoard.tsx`, but `recordGameResult` is already called via the `useEffect` that watches `phase === 'gameEnd'`. This one is actually **fine**.

**3. RoundEndModal "Begin Voyage" label bug**
- Line 136 in `RoundEndModal.tsx`: The button reads `Begin Voyage ${round + 1}` — but `round` here is the *current* round, so after round 1 it says "Begin Voyage 2" correctly. This is actually fine.

**4. SetSailPanel: "Best of 1" vs "Best of 3" mismatch**
- When `bestOf = 1`, `startGame` is called with `maxRounds = 1`. In `endTurn` (gameStore line 732): `skipRoundEnd = fullState.maxRounds <= 1` skips round-end modal and jumps straight to `gameEnd`. The loss-recording `useEffect` fires on `gameEnd` — so this path is already fine for natural game endings.

**5. Stats win-rate is tracked but never reset on "Play Again"**
- `restartGame()` does not clear or alter stats — this is correct behavior (cumulative stats).

**6. DisconnectModal "Return to Lobby" does NOT record a loss**
- Line 71-76 in `DisconnectModal.tsx`: `handleReturnToLobby` calls `onResetGame` without recording a result. For multiplayer this is ambiguous (connection dropped, not a forfeit), so this is a design decision, not necessarily a bug.

---

### Summary of Planned Changes

**Priority 1 — Fix the bug:**
- `GameBoard.tsx` line 499: wrap the `AlertDialogAction` `onClick` to call `recordGameResult(false)` before `resetGame`, but only for single-player games in progress.

```text
Before:
  <AlertDialogAction onClick={resetGame} ...>

After:
  onClick={() => {
    if (!isMultiplayer && phase === 'playing') {
      recordGameResult(false);
    }
    resetGame();
  }}
```

This is the only code change needed. Everything else in the codebase is working correctly.

---

### What Is Working Well

- Natural game-end loss/win recording (the `useEffect` on `phase === 'gameEnd'`)
- Multiplayer disconnect handling (DisconnectModal with claim-victory flow)
- AI difficulty, rules engine, optional rules
- Responsive layouts (phone/tablet/desktop)
- Sound, music, and consent gating
- Stats display in SetSailPanel (W/L/winrate)
- Round end modal, VictoryScreen, score breakdowns
- PWA manifest, install prompt, remote config polling
- Age consent modal and restricted mode gating

---

### Technical Details

**File:** `src/components/game/GameBoard.tsx`  
**Line:** 499  
**Change:** Replace `onClick={resetGame}` with an inline handler that conditionally calls `recordGameResult(false)` first when quitting a live single-player game.
