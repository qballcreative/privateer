

# Ad System, Age Gate & Restricted Mode — Implementation Plan

## Overview

This adds a consent-driven ad system with age gating, restricted under-13 mode, and extensible ad provider architecture. All state is managed via Zustand with localStorage persistence, matching the existing pattern.

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│  First Launch → AgeConsentModal (gate)      │
│  ↓ stores age/consent in consentStore       │
└──────────────┬──────────────────────────────┘
               │
  ┌────────────▼────────────┐
  │    consentStore (zustand)│
  │  ageGroup, adsEnabled,   │
  │  personalized, paidAdFree│
  │  restrictedMode, hasConsented │
  └────────────┬────────────┘
               │
  ┌────────────▼────────────┐
  │   Ad Provider Layer      │
  │  NoopProvider (default)  │
  │  NativeBridge (future)   │
  └────────────┬────────────┘
               │
  ┌────────────▼─────────────────┐
  │  Ad Surfaces (components)     │
  │  - LobbyBanner               │
  │  - InterstitialAd (roundEnd) │
  │  - RewardedAd (treasure)     │
  └──────────────────────────────┘
```

---

## New Files

### 1. `src/store/consentStore.ts` — Zustand persisted store
- **State**: `ageGroup: 'under13' | '13-15' | '16-17' | '18+' | null`, `adsEnabled`, `personalizedAds`, `paidAdFree`, `restrictedMode`, `hasConsented`
- **Derived**: `shouldShowAds` = adsEnabled && !paidAdFree
- **Actions**: `setConsent(ageGroup, personalizedAds)` — sets all flags based on age logic; `setPaidAdFree(boolean)`; `resetConsent()` — clears for re-flow
- Persisted to `privateer-consent` localStorage key

### 2. `src/lib/adProvider.ts` — Ad provider abstraction
- `AdProvider` interface: `showBanner()`, `hideBanner()`, `showInterstitial(): Promise<boolean>`, `showRewarded(): Promise<boolean>`
- `NoopAdProvider` — all methods return safely, no-op
- `NativeBridgeProvider` — checks `window.NativeAds`, delegates if available, falls back to noop
- `createAdProvider(personalized: boolean): AdProvider` factory
- `adCooldown` module-level tracker: `lastInterstitialTime`, enforces 120s cooldown
- `requestInterstitial(provider)` — checks cooldown, calls provider, returns boolean
- `requestRewarded(provider)` — calls provider, returns boolean for reward grant

### 3. `src/lib/adAnalytics.ts` — Consent-aware analytics emitter
- `emitAdEvent(event: 'ad_impression' | 'ad_click' | 'ad_reward_granted', data?)` — checks consentStore; suppresses if restrictedMode or under13
- Logs only non-identifying errors for under-13

### 4. `src/components/game/AgeConsentModal.tsx` — First-launch modal
- Full-screen overlay, keyboard-navigable, no preselection
- Step 1: Age selection (4 radio buttons: Under 13, 13–15, 16–17, 18+)
- Step 2 (13+ only): Personalization opt-in (checkbox, only for 18+; hidden/forced-off for 13–17)
- Under 13: shows notice about simplified mode, confirms consent
- Calls `consentStore.setConsent()` on submit
- Neutral language throughout; no nudging

### 5. `src/components/game/AdBanner.tsx` — Lobby banner
- Renders a reserved-height `div` (e.g. `h-[90px]`) in the lobby regardless of ad state — prevents layout shift
- Only fills with ad content when `shouldShowAds` is true
- Never renders during `phase !== 'lobby'`

### 6. `src/components/game/InterstitialAd.tsx` — Round-end interstitial
- Triggered by GameBoard when `phase === 'roundEnd'` and `shouldShowAds`
- Max 1 per round (tracked via local ref), 120s global cooldown via adProvider
- Shows overlay, auto-dismisses or user-dismisses
- Emits `ad_impression` analytics

### 7. `src/components/game/RewardedAd.tsx` — Treasure chest reward
- Button component shown only when treasure chest rule fires AND `shouldShowAds`
- User-initiated; on completion grants exactly one reward boost
- Emits `ad_reward_granted`

---

## Modified Files

### 8. `src/components/game/LandingPage.tsx`
- Import `consentStore`; if `!hasConsented`, render `AgeConsentModal` first
- If `restrictedMode`: lock difficulty to `'easy'`, hide multiplayer button, hide optional rules, show neutral notice banner
- Add `<AdBanner />` at bottom of hero section (reserved space)

### 9. `src/components/game/SettingsPanel.tsx`
- Add new "Privacy & Ads" section at bottom:
  - Display: current age group, ads on/off, personalization on/off, paid status
  - "Change Age & Ad Preferences" button → reopens AgeConsentModal (via `resetConsent()`)
  - "Remove Ads" toggle (simulates paid state for now)

### 10. `src/components/game/GameBoard.tsx`
- After round-end state: conditionally render `<InterstitialAd />` if eligible
- Pass reward trigger to treasure chest reveal flow for `<RewardedAd />`

### 11. `src/store/settingsStore.ts`
- No structural changes; the consent store is separate. Optional rules remain here but the LandingPage will force them off when `restrictedMode` is true.

---

## Key Logic Rules

| Age Group | Ads Default | Personalization | Restricted Mode |
|-----------|-------------|-----------------|-----------------|
| Under 13  | OFF         | OFF             | YES             |
| 13–15     | ON (unless paid) | OFF        | NO              |
| 16–17     | ON (unless paid) | OFF        | NO              |
| 18+       | ON (unless paid) | Opt-in only | NO             |

- `paidAdFree = true` → all ad surfaces immediately disabled (reactive via Zustand, no reload)
- Restricted mode: easy-only, no multiplayer, no optional rules, no ads, no analytics

## Acceptance Criteria Mapping

- Interstitial: roundEnd only, ≤1/round, 120s cooldown → enforced in `adProvider` + `InterstitialAd` component
- Rewarded: treasure chest only, one reward per view → `RewardedAd` guards with completion flag
- Banner: lobby-only reserved space → `AdBanner` checks phase + fixed height div
- Under 13 → restrictedMode + no ads/analytics → `consentStore` flags
- Paid removal → immediate disable → reactive Zustand state
- All ad calls safe when disabled → `NoopAdProvider` returns cleanly

