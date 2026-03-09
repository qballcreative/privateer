
# Privateer: Letters of Marque — Implementation Plan

> Last updated: 2026-03-09

---

## Site Evaluation

### Strengths
- ✅ Strong thematic design (Pirata One typography, gold/ocean palette, wood textures)
- ✅ Full AI opponent with 4 difficulty tiers and strategic heuristics
- ✅ Rules engine plugin system (storm, pirate raid, treasure chest optional rules)
- ✅ P2P multiplayer via PeerJS (WebRTC)
- ✅ Best-of-1 / Best-of-3 match structure with persistent W/L stats
- ✅ PWA support (manifest, service worker, install prompt)
- ✅ Age consent + restricted mode for COPPA compliance
- ✅ Remote config store (feature flags, difficulty defaults)
- ✅ Debug panel + ring-buffer debug logging
- ✅ Vitest unit tests for the rules engine

### Weaknesses / Issues Found
- ❌ **BUG (FIXED):** AI doesn't move when it is selected as the first player (random start)
- ❌ P2P multiplayer has no TURN server fallback → fails behind strict NAT
- ❌ No reconnection flow when a peer disconnects mid-game
- ❌ Ad system is stubbed (no real SDK integrated)
- ❌ No IAP / premium unlock flow
- ❌ No E2E test coverage (only unit tests)
- ❌ No theme toggle (dark-only)
- ❌ Tutorial tooltips not yet implemented on the game board
- ❌ Loading states missing (no skeleton screens during game start / AI thinking)
- ❌ `nextRound` always resets `currentPlayerIndex` to 0, ignoring who won the prior round
- ❌ `restartGame` doesn't preserve the `firstPlayer` preference

---

## Priority Roadmap

### 🔴 P0 — Critical Bugs

#### 1. AI First-Move Bug ✅ FIXED
**Problem:** When `firstPlayer = 'random'` lands on the AI, `startGame` called `set(initialState)` without scheduling `makeAIMove()`. The AI sat "pondering" forever.

**Fix applied** in `src/store/gameStore.ts`:
```typescript
// After set(initialState) in startGame:
if (initialState.players[initialState.currentPlayerIndex]?.isAI) {
  const notifDuration = useSettingsStore.getState().actionNotificationDuration;
  setTimeout(() => get().makeAIMove(), (notifDuration * 1000) + 500);
}
```

#### 2. Next-Round First Player
**Problem:** `nextRound()` hardcodes `currentPlayerIndex: 0`. In most trading card games the loser of the previous round goes first (or the winner — should be configurable).

**Fix:** After determining `roundWinner`, store loser index and use it as starting player in `nextRound`.

**File:** `src/store/gameStore.ts` → `nextRound()`

#### 3. Restart Game Preserves Settings
**Problem:** `restartGame()` calls `startGame(playerName, difficulty, optionalRules)` without passing `firstPlayer`, so random-first is lost on rematch.

**Fix:** Store `firstPlayer` preference in game state and pass it through `restartGame`.

**File:** `src/store/gameStore.ts`, `src/types/game.ts`

---

### 🟠 P1 — Multiplayer Robustness

#### 4. TURN Server Fallback
**Problem:** PeerJS WebRTC connections fail behind symmetric NAT (corporate, mobile carrier networks). Without a TURN server, ~15–20% of connection attempts fail.

**Plan:**
1. Add `iceServers` config to PeerJS constructor pointing at a public TURN server (e.g., Metered.ca free tier, or self-hosted coturn).
2. Surface connection quality in the `ConnectionIndicator` component.
3. Store the TURN credentials in `public/config/remote.json` (or as env secrets).

**Files:** `src/store/multiplayerStore.ts`, `src/components/game/ConnectionIndicator.tsx`, `public/config/remote.json`

#### 5. Reconnection UX
**Problem:** If a peer disconnects, the opponent sees a spinner but no clear feedback or recovery path.

**Plan:**
1. Add a 30-second reconnection window in `multiplayerStore` — attempt to re-establish the peer connection using the same room ID.
2. Show a `DisconnectModal` with countdown: "Waiting for [Opponent] to reconnect… 28s"
3. After timeout, offer: "Claim Victory" (record as win) or "Return to Port" (no record).
4. Emit a `ping`/`pong` heartbeat every 5s to detect silent disconnects faster.

**Files:** `src/store/multiplayerStore.ts`, `src/components/game/DisconnectModal.tsx`

---

### 🟡 P2 — Polish

#### 6. Loading States / Skeleton Screens
**Problem:** Game board appears instantly but AI "thinking" has no visual feedback beyond the turn banner.

**Plan:**
- Add a pulsing "Thinking…" overlay on the AI player's hold area during AI turn.
- Add skeleton placeholders on the `TradingPost` during the brief game-start transition.
- Show a loading spinner in `SetSailPanel` after "Start Game" is clicked until the board renders.

**Files:** `src/components/game/GameBoard.tsx`, `src/components/game/ShipsHold.tsx`, `src/components/game/SetSailPanel.tsx`

#### 7. Theme Toggle (Dark / Light / Parchment)
**Problem:** App is dark-only. A sepia "parchment" theme would complement the pirate aesthetic and improve daytime readability.

**Plan:**
1. Add `theme` field to `settingsStore` (`'dark' | 'light' | 'parchment'`).
2. Define CSS variable overrides for each theme in `index.css`.
3. Add theme toggle button to `SettingsPanel`.
4. Persist via zustand `persist` middleware (already in place).

**Files:** `src/store/settingsStore.ts`, `src/index.css`, `src/components/game/SettingsPanel.tsx`

#### 8. Tutorial Tooltips on Game Board
**Problem:** The tutorial exists as a separate page but first-time players get no in-context guidance on the game board.

**Plan:**
1. Add a `tutorialStore` step tracker (already exists — review and extend).
2. Wrap key UI areas (`TradingPost`, `ShipsHold`, `UnloadChest`) in a `TutorialTooltip` component.
3. Show dismissible tooltips that advance through 6 steps on first game only.
4. "Skip Tutorial" link in step 1.

**Files:** `src/store/tutorialStore.ts`, `src/components/game/Tutorial.tsx`, `src/components/game/GameBoard.tsx`

---

### 🟢 P3 — Monetization

#### 9. Real Ad SDK Integration
**Problem:** `adProvider.ts` and all ad components (`AdBanner`, `InterstitialAd`, `RewardedAd`) are stubbed with mock implementations.

**Plan:**
1. Evaluate SDK options: **Google AdSense** (web), **AdMob** (if wrapping in Capacitor), or **Playwire** (game-focused).
2. Implement `platform.ts` detection to serve different ad units for PWA vs. browser.
3. Wire `InterstitialAd` to fire between rounds (already gated by `remoteConfig.showInterstitialAds`).
4. Wire `RewardedAd` to unlock an extra turn or reveal AI's hand temporarily.

**Files:** `src/lib/adProvider.ts`, `src/lib/platform.ts`, ad component files

#### 10. IAP / Premium Unlock
**Problem:** No premium tier exists.

**Plan:**
1. Define premium features: remove ads, unlock "Admiral" AI difficulty always, custom player avatar.
2. Integrate **Stripe** for web payments (one-time purchase, $2.99).
3. Store `isPremium` in `playerStore` (persist locally; validate on Lovable Cloud edge function).
4. Add "Go Premium" CTA in `SettingsPanel` and after a loss to an ad.

**Files:** `src/store/playerStore.ts`, new `src/pages/Premium.tsx`, edge function

---

### 🔵 P4 — Testing

#### 11. E2E Test Coverage (Playwright)
**Problem:** Only unit tests exist for the rules engine. No end-to-end coverage of user flows.

**Plan — test scenarios:**
| Scenario | Priority |
|----------|----------|
| Start AI game (human first) and take a card | P0 |
| Start AI game (random first → AI goes first) | P0 |
| Sell cards, verify token awarded | P1 |
| Exchange cards (valid + invalid same-type) | P1 |
| Complete a full round, verify round-end modal | P1 |
| Best-of-3 — play to game end | P2 |
| Multiplayer — create room + join (same browser, two tabs) | P2 |

**Files:** New `e2e/` directory with `playwright.config.ts`

---

## Implementation Order (Recommended)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | ✅ AI first-move bug | XS | P0 |
| 2 | Next-round first player fix | S | P0 |
| 3 | Restart preserves settings | XS | P0 |
| 4 | Loading states / AI thinking UI | S | UX |
| 5 | Tutorial tooltips | M | Retention |
| 6 | Theme toggle | S | Polish |
| 7 | TURN server config | S | Multiplayer reach |
| 8 | Reconnect UX | M | Multiplayer retention |
| 9 | Playwright E2E setup | M | Quality |
| 10 | Real Ad SDK | L | Revenue |
| 11 | IAP / Stripe | L | Revenue |

---

## Visual Design Plan (Existing — carried forward)

The original design plan (CargoObject metaphor, TradingPost, ShipsHold, TreasureStack) has been **implemented**. The following visual polish items remain:

- [ ] Parchment theme CSS variables
- [ ] AI "thinking" overlay animation on opponent's hold
- [ ] Victory screen treasure chest opening animation (framer-motion)
- [ ] Round-end "Wax Seal" animation for round winner indicator
