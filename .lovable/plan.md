# Privateer: Letters of Marque — Implementation Plan

> Last updated: 2026-03-09

---

## Fresh Site Assessment (v2) — Overall: **8.2 / 10** ⬆️

| Category | Score | Status |
|----------|-------|--------|
| Visual Design | 8.5 | ✅ Copyright fixed, logo resized |
| Game Mechanics | 8.0 | ✅ Sell confirmation added |
| AI Opponent | 8.0 | ✅ Extracted to module, thinking overlay |
| UX & Playability | 7.5 | ✅ Invalid feedback + mini-info bar |
| Mobile | 7.5 | ✅ Mini-info bar shows key stats |
| Multiplayer | 6.0 | ✅ TURN server config ready |
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

### P2 Multiplayer
- ✅ ICE servers now loaded from remote config (supports TURN when added)
- ✅ Heartbeat/ping-pong already implemented
- ✅ DisconnectModal with countdown already exists

### P3 Architecture
- ✅ AI extracted to `src/lib/aiPlayer.ts` (~300 lines)
- ✅ Fixed syncEngineRules no-op
- ✅ Immutable state patterns in takeCard, takeAllShips, sellCards

### Visual Polish
- ✅ AI "thinking" overlay (already implemented in ShipsHold)

---

## Remaining Roadmap

### 🟢 P3 — Architecture

#### ✅ Split GameBoard Layouts
Extracted phone/tablet/desktop into `src/components/game/layouts/`. GameBoard reduced from 881 → ~300 lines.

---

### 🔵 P4 — Monetization

#### Real Ad SDK Integration
Replace stubs with Google AdSense or similar.

**Files:** `src/lib/adProvider.ts`, ad components

---

## Visual Polish Backlog

- [ ] Parchment theme CSS variables
- [ ] Victory screen treasure chest opening animation
- [ ] Round-end "Wax Seal" animation
- [ ] Custom pirate favicon
