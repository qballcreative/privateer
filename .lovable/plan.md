

## Comprehensive App Review & Improvement Plan

### Overall Rating: 8.7/10

The game is well-architected with strong visual design, a sophisticated AI, and polished UX. Here are the areas that can push it further.

---

### Strengths (what's working well)

- **Architecture**: Clean separation — RulesEngine plugin system, Zustand stores, memo'd components, cryptographic shuffling
- **AI**: 4-tier difficulty with weighted scoring across blocking, bonus pursuit, sell timing, and token urgency
- **Visual design**: Custom cargo tokens, doubloon stacks, wood/leather textures, wax-seal voyage indicators — cohesive tactile aesthetic
- **Animations**: Spring-based Framer Motion throughout — card rise-from-dock, ship fan-out, sell sparkles, ticking score counters
- **Multiplayer**: P2P via PeerJS with state validation, reconnection flow, disconnect timer with claim-victory mechanic
- **Accessibility**: aria-live sell announcements in UnloadChest

---

### Issues & Improvements Identified

#### 1. VictoryScreen "Play Again" doesn't start a new game
Currently both buttons call `resetGame()` which returns to the lobby. The "Play Again" button should auto-start a new game with the same settings (difficulty, optional rules, player name).

#### 2. GameBoard.tsx is 1,147 lines — too large
The disconnection modal (~150 lines), round-end modal (~100 lines), multiplayer chat (~70 lines), and phone/tablet/desktop layouts are all inline. Extracting these improves maintainability and reduces re-render scope.

#### 3. No confirmation on "Return Home" mid-game
The Home button in the header calls `resetGame()` with no confirmation dialog. A misclick loses the entire game.

#### 4. Round-end modal doesn't show per-round score breakdown
The Voyage End modal shows total doubloons per player but not the breakdown (tokens vs commissions vs fleet bonus). The VictoryScreen already has this logic — reuse it.

#### 5. Mobile Trading Post horizontal scroll isn't obvious
Cards overflow into a horizontal scroll on phone, but there's no visual scroll indicator. Users may not realize they can scroll to see more cards.

#### 6. Sound plays even when soundEnabled is false (edge case)
The deck-low creak ambience (`sea_sounds.wav`) plays based on `isDeckLow` state but doesn't check `soundEnabled` from the settings store. Same issue with the creak not respecting `soundVolume`.

#### 7. Missing keyboard accessibility
The Trading Post cards and Ship's Hold cargo objects are `motion.div` with `onClick` but no `role="button"`, `tabIndex`, or keyboard event handlers. Not usable via keyboard alone.

#### 8. "Best of 1" mode skips voyage structure
When `bestOf` is set to 1, the game still goes through `roundEnd` → `nextRound` flow, showing "Voyage 1 Complete!" then immediately ending. Should skip the round-end modal and go straight to the VictoryScreen.

---

### Improvement Plan

#### Phase A: Quick Fixes (low effort, high impact)

| # | Fix | File(s) |
|---|-----|---------|
| A1 | Wire "Play Again" to auto-start with same settings | `VictoryScreen.tsx`, `GameBoard.tsx`, `gameStore.ts` |
| A2 | Add confirmation dialog on Home button mid-game | `GameBoard.tsx` |
| A3 | Fix creak ambience to respect sound settings | `GameBoard.tsx` |
| A4 | Skip round-end modal in best-of-1 mode | `gameStore.ts` |

#### Phase B: UX Polish

| # | Improvement | File(s) |
|---|-------------|---------|
| B1 | Add scroll fade indicators on mobile Trading Post | `TradingPost.tsx` |
| B2 | Add keyboard accessibility (`role`, `tabIndex`, `onKeyDown`) to CargoObject | `CargoObject.tsx` |
| B3 | Add score breakdown to round-end modal (reuse `getScoreBreakdown`) | `GameBoard.tsx` or extract `RoundEndModal.tsx` |
| B4 | Show per-round winners in VictoryScreen (currently shows totals only because `roundWins` is aggregated — track per-round winner IDs) | `gameStore.ts`, `VictoryScreen.tsx` |

#### Phase C: Code Health

| # | Refactor | File(s) |
|---|----------|---------|
| C1 | Extract `DisconnectModal` component from GameBoard | New `DisconnectModal.tsx` |
| C2 | Extract `RoundEndModal` component from GameBoard | New `RoundEndModal.tsx` |
| C3 | Extract `MultiplayerChat` component from GameBoard | New `MultiplayerChat.tsx` |

This would reduce `GameBoard.tsx` from ~1,150 lines to ~750 lines.

---

### Recommended Priority

**Start with Phase A** (4 quick fixes) — these are bugs/gaps that affect real gameplay. Then **Phase B** for polish. Phase C is optional refactoring that improves developer experience but doesn't change user-facing behavior.

Total estimated effort: ~8-10 implementation messages across all phases.

