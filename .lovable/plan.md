# Privateer: Letters of Marque — Implementation Plan

> Last updated: 2026-03-09

---

## Fresh Site Assessment (v2) — Overall: **8.0 / 10** ⬆️

| Category | Score | Status |
|----------|-------|--------|
| Visual Design | 8.5 | ✅ Copyright fixed, logo resized |
| Game Mechanics | 8.0 | ✅ Sell confirmation added |
| AI Opponent | 8.0 | ✅ Extracted to module |
| UX & Playability | 7.5 | ✅ Invalid feedback + mini-info bar |
| Mobile | 7.5 | ✅ Mini-info bar shows key stats |
| Multiplayer | 5.0 | TURN server needed |
| Onboarding | 7.5 | ✅ Naming fixed |
| Performance | 8.0 | ✅ Preload extracted |
| Code Quality | 8.0 | ✅ AI extracted, immutable state |
| Monetization | 6.0 | Ad space reserved |

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

### P3 Architecture
- ✅ AI extracted to `src/lib/aiPlayer.ts` (~300 lines)
- ✅ Fixed syncEngineRules no-op
- ✅ Immutable state patterns in takeCard, takeAllShips, sellCards

---

## Remaining Roadmap

### 🟡 P2 — Multiplayer Robustness

#### TURN Server Fallback
Add `iceServers` config with TURN credentials for NAT traversal.

**Files:** `src/store/multiplayerStore.ts`, `public/config/remote.json`

#### Reconnection UX Improvements
30-second window with countdown, heartbeat ping/pong.

**Files:** `src/store/multiplayerStore.ts`, `src/components/game/DisconnectModal.tsx`

---

### 🟢 P3 — Architecture

#### Split GameBoard Layouts
Extract phone/tablet/desktop layouts into separate components to reduce file size.

**Files:** `src/components/game/layouts/`

---

### 🔵 P4 — Monetization

#### Real Ad SDK Integration
Replace stubs with Google AdSense or similar.

**Files:** `src/lib/adProvider.ts`, ad components

---

## Visual Polish Backlog

- [ ] Parchment theme CSS variables
- [ ] AI "thinking" overlay animation on opponent's hold
- [ ] Victory screen treasure chest opening animation
- [ ] Round-end "Wax Seal" animation
- [ ] Custom pirate favicon
