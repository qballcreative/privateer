# Privateer: Letters of Marque — Implementation Plan

> Last updated: 2026-03-09

---

## Fresh Site Assessment (v2) — Overall: **7.5 / 10**

| Category | Score | Top Priority |
|----------|-------|--------------|
| Visual Design | 8.5 | ✅ Copyright year fixed |
| Game Mechanics | 8.0 | Add sell confirmation dialog |
| AI Opponent | 8.0 | Improve exchange evaluation on hard/expert |
| UX & Playability | 7.0 | ✅ Invalid action feedback wired |
| Mobile | 7.0 | Mini treasure/opponent info bar |
| Multiplayer | 5.0 | Add TURN server for NAT traversal |
| Onboarding | 7.5 | ✅ "Iron" → "Cannonballs" fixed |
| Performance | 8.0 | ✅ Preload images extracted |
| Code Quality | 7.5 | Extract AI logic from gameStore |
| Monetization | 6.0 | Reserve ad banner space |

---

## ✅ Completed (Quick Wins)

- **Copyright year** → Updated to 2026 in LandingPage and HowToPlay
- **"Iron" naming** → Changed to "Cannonballs" in HowToPlay scoring table
- **Invalid action feedback** → TradingPost now calls `triggerInvalidAction` on failed take
- **Duplicate preload images** → Extracted to `src/lib/preloadImages.ts`

---

## Priority Roadmap

### 🔴 P0 — Critical Bugs

#### 1. AI First-Move Bug ✅ FIXED
AI now correctly moves when selected as first player.

#### 2. Next-Round First Player
**Problem:** `nextRound()` hardcodes `currentPlayerIndex: 0`. The loser/winner of the previous round should go first.

**File:** `src/store/gameStore.ts`

#### 3. Restart Game Preserves Settings
**Problem:** `restartGame()` doesn't pass `firstPlayer`, losing the random-first preference.

**File:** `src/store/gameStore.ts`, `src/types/game.ts`

---

### 🟠 P1 — UX Improvements

#### 4. Sell Confirmation Dialog
Add a confirmation step before selling: "Sell 3 Rum for 9 doubloons?"

**Files:** `src/components/game/UnloadChest.tsx`

#### 5. Reduce In-Game Logo Size
Banner logo is too large (`h-40 sm:h-48 lg:h-56`). Reduce by ~30%.

**File:** `src/components/game/GameBoard.tsx`

#### 6. Mobile Mini-Info Bar
Show treasure supply and opponent state without opening drawers.

**Files:** `src/components/game/GameBoard.tsx`

---

### 🟡 P2 — Multiplayer Robustness

#### 7. TURN Server Fallback
Add `iceServers` config with TURN credentials for NAT traversal.

**Files:** `src/store/multiplayerStore.ts`, `public/config/remote.json`

#### 8. Reconnection UX Improvements
30-second window with countdown, heartbeat ping/pong.

**Files:** `src/store/multiplayerStore.ts`, `src/components/game/DisconnectModal.tsx`

---

### 🟢 P3 — Architecture

#### 9. Extract AI Logic ✅ DONE
Moved ~300 lines of AI code to `src/lib/aiPlayer.ts`. gameStore now calls `computeAIMove()`.

#### 10. Fix syncEngineRules No-op ✅ DONE
Removed the empty for-loop body that did nothing.

#### 11. Split GameBoard Layouts
Extract phone/tablet/desktop layouts into separate components.

**Files:** `src/components/game/layouts/`

#### 12. Fix Mutable State Patterns
`sellCards` and `takeCard` mutate player arrays directly before spreading.

**File:** `src/store/gameStore.ts`

---

### 🔵 P4 — Monetization

#### 12. Reserve Ad Banner Space
Prevent layout shifts when real ads are integrated.

**File:** `src/components/game/AdBanner.tsx` (already reserves 90px height)

#### 13. Real Ad SDK Integration
Replace stubs with Google AdSense or similar.

**Files:** `src/lib/adProvider.ts`, ad components

---

## Visual Polish Backlog

- [ ] Parchment theme CSS variables
- [ ] AI "thinking" overlay animation on opponent's hold
- [ ] Victory screen treasure chest opening animation (framer-motion)
- [ ] Round-end "Wax Seal" animation for winner indicator
- [ ] Custom pirate favicon
