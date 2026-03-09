# Privateer: Letters of Marque — Implementation Plan

> Last updated: 2026-03-09

---

## Fresh Site Assessment (v3) — Overall: **8.5 / 10** ⬆️

| Category | Score | Status |
|----------|-------|--------|
| Visual Design | 8.5 | ✅ Polished, themed UI |
| Game Mechanics | 8.0 | ✅ Sell confirmation, rules engine |
| AI Opponent | 8.0 | ✅ Extracted to module, thinking overlay |
| UX & Playability | 7.5 | ✅ Invalid feedback + mini-info bar |
| Mobile | 7.5 | ✅ Responsive layouts, mini-info bar |
| Multiplayer | 7.0 | ⬆️ Forfeit signals + disconnect detection improved |
| Onboarding | 8.0 | ✅ 9-step interactive tutorial + How To Play page |
| Performance | 8.5 | ⬆️ WebP migration complete (~12 MB saved) |
| Code Quality | 8.0 | ✅ AI extracted, immutable state, layout split |
| Monetization | 6.0 | Deferred — ad space reserved, SDK later |

---

## ✅ Completed

### Quick Wins
- Copyright year → 2026
- "Iron" → "Cannonballs" in HowToPlay
- Invalid action feedback wired to TradingPost
- Preload images extracted to shared module

### P0 Bugs
- ✅ AI first-move bug fixed
- ✅ Next-round first player (already implemented correctly)
- ✅ Restart preserves firstPlayer (already implemented)

### P1 UX
- ✅ Sell confirmation dialog with doubloon preview
- ✅ Reduced in-game logo size ~30%
- ✅ Mobile mini-info bar (supply, token stacks, opponent fleet)
- ✅ Lobby polish: persistent name input, W-L stats, GameLoadingScreen
- ✅ "Return to Port" quits recorded as losses

### P2 Multiplayer
- ✅ ICE servers now loaded from remote config (supports TURN when added)
- ✅ Heartbeat/ping-pong already implemented
- ✅ DisconnectModal with countdown already exists
- ✅ Explicit forfeit signals on tab close & "Return to Port"
- ✅ Phase gate expanded to cover `roundEnd` disconnects
- ✅ "Claim Victory" now routes to Victory Screen (not lobby reset)

### P3 Architecture
- ✅ AI extracted to `src/lib/aiPlayer.ts` (~300 lines)
- ✅ Fixed syncEngineRules no-op
- ✅ Immutable state patterns in takeCard, takeAllShips, sellCards
- ✅ GameBoard layouts split into phone/tablet/desktop components

### Performance
- ✅ All public PNG icons & backgrounds converted to WebP
- ✅ Old PNG files deleted, all references updated
- ✅ PWA runtime caching covers .webp assets

### Visual Polish
- ✅ AI "thinking" overlay
- ✅ Parchment theme CSS variables
- ✅ Custom pirate favicon
- ✅ Victory screen with score breakdown & confetti
- ✅ Round-end "Wax Seal" animation

---

## Remaining Roadmap

### 🟡 P1 — Design Token Cleanup

Several components still use hardcoded Tailwind color classes (`from-purple-500`, `text-yellow-400`, etc.) instead of semantic design tokens. Migrating these improves theme consistency and future dark/light mode support.

**Affected files:**
- `ActionNotification.tsx` — action color gradients
- `ScoreBoard.tsx` — AI badge gradient, hardcoded shadows
- `HowToPlay.tsx` — scoring grid colors per goods type

**Approach:** Define semantic token variants (e.g., `--color-rum`, `--color-gems`) in `index.css` and map them in `tailwind.config.ts`.

---

### 🟡 P2 — Token Asset Modernization (src/assets/)

The `src/assets/tokens/` and `src/assets/cards/` directories still contain PNG files imported via ES6. Converting these to WebP would reduce the JS bundle's embedded asset size.

**Files:** `src/assets/tokens/*.png`, `src/assets/cards/*.png`, `CargoObject.tsx`, `HowToPlay.tsx`

---

### 🟡 P3 — LandingPage Refactor

`LandingPage.tsx` (203 lines) is flagged as getting large. The `RecentVoyages` table component should be extracted to its own file.

**Files:** `src/components/game/LandingPage.tsx` → extract `RecentVoyages.tsx`

---

### 🔵 P4 — Monetization (Deferred)

#### Real Ad SDK Integration
Replace stubs with Google AdSense / AdMob. Target mobile-only placements.

**Files:** `src/lib/adProvider.ts`, ad components

**Note:** User will implement when ready. Current ad banner space is reserved and functional as a placeholder.

---

### 🔵 P5 — Future Enhancements

- **Sound effects polish** — Review and optimize audio file sizes (sea_sounds.wav is large)
- **Offline play** — PWA already caches assets; verify full offline game flow works
- **Accessibility audit** — Ensure all interactive elements have proper ARIA labels and keyboard navigation
- **E2E test coverage** — Add Vitest integration tests for core game actions (take, trade, sell, raid)
