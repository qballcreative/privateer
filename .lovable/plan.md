
## What's already done (can skip)

- ✅ AI first-move bug
- ✅ Next-round first player (loser goes first) — already in `nextRound()` lines 792-800
- ✅ Restart game preserves firstPlayer — already in `restartGame()` line 890
- ✅ Tutorial tooltip clamping
- ✅ Victory / round-end animations

---

## Remaining items to implement (6 tasks)

---

### 1. Parchment theme + theme toggle in Settings

**What:** Add a third theme option ("Parchment") alongside the existing dark theme. A light sepia palette using existing `--parchment` CSS variables already defined in `index.css`. Toggle lives in `SettingsPanel`.

**How:**
- `src/store/settingsStore.ts` — add `theme: 'dark' | 'parchment'` + `setTheme()`. Persisted automatically.
- `src/index.css` — add a `[data-theme="parchment"]` block on `:root` that overrides `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary` with warm sepia values using the existing `--parchment` color variables.
- `src/App.tsx` (or `src/main.tsx`) — read `theme` from store and set `document.documentElement.dataset.theme`.
- `src/components/game/SettingsPanel.tsx` — add a 2-button toggle (Dark / Parchment) beneath the existing sliders, using a `Sun`/`Moon` icon from lucide-react.

---

### 2. Tutorial replay button in Settings

**What:** A "Replay Tutorial" button at the bottom of the Settings panel that triggers `tutorialStore.start()` and closes the sheet.

**How:**
- `src/components/game/SettingsPanel.tsx` — import `useTutorialStore` and `useGameStore`, show the button only when `phase === 'playing'` (tutorial only makes sense on the game board). Button calls `startTutorial()` and programmatically closes the `Sheet` (via a controlled `open` state). Add a `GraduationCap` or `BookOpen` icon from lucide.

---

### 3. AI "pondering" overlay on the opponent's hold

**What:** When it's the AI's turn, show a pulsing "Pondering…" overlay directly on the opponent's ShipsHold card rather than just the center banner. Makes it clear *where* the AI is thinking.

**How:**
- `src/components/game/ShipsHold.tsx` — accept an optional `isPondering?: boolean` prop. When true, render a framer-motion `AnimatePresence` overlay inside the hold with a looping `opacity` pulse (0.6→1→0.6) and a small `Swords` spinner + "Pondering…" text.
- `src/components/game/GameBoard.tsx` — pass `isPondering={currentPlayerIndex === opponentIndex && phase === 'playing'}` to the opponent `ShipsHold` in all three layout blocks (phone, tablet, desktop).

---

### 4. Loading spinner on "Start Game"

**What:** After clicking Start Game, show a brief loading state on the button while the game board mounts.

**How:**
- `src/components/game/SetSailPanel.tsx` — lift a `loading` boolean prop into the panel. When `true`, replace button text with a spinning `Loader2` icon from lucide.
- `src/components/game/LandingPage.tsx` — add `const [starting, setStarting] = useState(false)`. In `handleStart`, set `starting = true` before calling `startGame`. The game phase change will unmount the landing page, so no explicit reset is needed.
- Pass `loading={starting}` down to `SetSailPanel` → into the `ActionButton`.

---

### 5. Per-game score history ("Recent Voyages") in playerStore + landing page

**What:** Track the last 5 game results (opponent difficulty, player score, AI score, result, date) and display them in a collapsible "Recent Voyages" section on the landing page below the SetSailPanel.

**How:**
- `src/store/playerStore.ts` — add `recentVoyages: VoyageRecord[]` (capped at 5 entries) and update `recordGameResult` to accept a `VoyageRecord` payload. Add a `VoyageRecord` interface:
  ```ts
  interface VoyageRecord {
    date: string; // ISO
    won: boolean;
    difficulty: Difficulty;
    playerScore: number;
    opponentScore: number;
  }
  ```
- `src/components/game/GameBoard.tsx` — in the `phase === 'gameEnd'` useEffect, pass scores from `calculateScore()` alongside the win/loss result.
- `src/components/game/LandingPage.tsx` — render a new `RecentVoyages` inline component beneath the `SetSailPanel`. Shows a compact table (5 rows max) with Win/Loss badge, difficulty, scores, date. Collapsible if `recentVoyages.length === 0`.

---

### 6. Music discovery toast

**What:** On first game start, if `musicEnabled === false`, show a one-time dismissible toast: "🎵 Background music is available — enable it in Settings." Stored in settingsStore so it only shows once.

**How:**
- `src/store/settingsStore.ts` — add `hasSeenMusicHint: boolean` + `setHasSeenMusicHint()`.
- `src/components/game/GameBoard.tsx` — in the `phase === 'playing'` useEffect, after music starts, if `!musicEnabled && !hasSeenMusicHint`, fire `toast()` from Sonner and call `setHasSeenMusicHint(true)`.

---

## Files touched

| File | Changes |
|---|---|
| `src/store/settingsStore.ts` | Add `theme`, `setTheme`, `hasSeenMusicHint`, `setHasSeenMusicHint` |
| `src/store/playerStore.ts` | Add `VoyageRecord`, `recentVoyages`, update `recordGameResult` |
| `src/index.css` | Add `[data-theme="parchment"]` CSS variable block |
| `src/App.tsx` | Apply `data-theme` attribute from store |
| `src/components/game/SettingsPanel.tsx` | Theme toggle + Tutorial replay button |
| `src/components/game/ShipsHold.tsx` | `isPondering` prop + overlay |
| `src/components/game/GameBoard.tsx` | Pass `isPondering`, voyage record with scores, music toast |
| `src/components/game/SetSailPanel.tsx` | `loading` prop on Start Game button |
| `src/components/game/LandingPage.tsx` | `starting` state + Recent Voyages section |
