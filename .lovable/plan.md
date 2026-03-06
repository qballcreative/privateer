

# RemoteConfig System — Implementation Plan

## Overview

Add a `RemoteConfig` store that fetches `/config/remote.json` on boot and every 30 minutes, with safe fallback defaults. Wire it into the ad system, RulesEngine, and AI difficulty defaults. Local settings always override remote values.

## New Files

### 1. `src/store/remoteConfigStore.ts` — Zustand store (not persisted)

**Shape:**
```ts
interface RemoteConfig {
  adsEnabled: boolean;                    // default: true
  interstitialFrequency: string;          // default: "round_end:capped=1;cooldown=120s"
  rewardedEnabled: boolean;               // default: true
  defaultAIDifficulty: Difficulty;        // default: "easy"
  enabledRules: string[];                 // default: []
  maxPlayers: number;                     // default: 2
}
```

**State:** `config: RemoteConfig`, `loaded: boolean`, `error: string | null`

**Actions:**
- `fetchConfig()` — fetches `/config/remote.json`, merges with defaults on partial/failed responses, sets `loaded: true`
- `startPolling()` / `stopPolling()` — setInterval every 30 min, stores interval id
- Internal `parseInterstitialFrequency(str)` helper that extracts `capped` and `cooldown` values from the frequency string

**Boot behavior:** Call `fetchConfig()` once on import, then `startPolling()`. If fetch fails (404, network error), silently use defaults — no user-facing error.

### 2. `public/config/remote.json` — Default config file

Contains all keys with their default values. Serves as both documentation and the actual fetch target.

## Modified Files

### 3. `src/lib/adProvider.ts`
- Import `useRemoteConfigStore`
- `requestInterstitial`: read `interstitialFrequency` from remote config to get cooldown value instead of hardcoded `120_000`. Parse the string; fall back to 120s if malformed.
- Add `isAdsRemoteEnabled()` helper that checks `remoteConfig.adsEnabled`

### 4. `src/store/consentStore.ts`
- `shouldShowAds()`: add check for `remoteConfigStore.config.adsEnabled` — if remote says false, ads are globally off regardless of consent
- `shouldShowRewarded()`: new derived that also checks `remoteConfig.rewardedEnabled`

### 5. `src/components/game/InterstitialAd.tsx`
- Read `interstitialFrequency` from remote config store to respect dynamic capped/cooldown values

### 6. `src/components/game/RewardedAd.tsx`
- Check `remoteConfig.rewardedEnabled` before rendering

### 7. `src/store/gameStore.ts`
- In `startGame`: read `remoteConfig.defaultAIDifficulty` as fallback when no explicit difficulty selected
- In `syncEngineRules`: merge `remoteConfig.enabledRules` with local optional rules — local toggles override (if user explicitly disabled a rule, it stays off; remote can enable rules the user hasn't touched)

### 8. `src/components/game/LandingPage.tsx`
- Read `remoteConfig.maxPlayers` to cap player count in lobby
- Read `remoteConfig.defaultAIDifficulty` as initial difficulty selection

### 9. `src/App.tsx` (or `src/main.tsx`)
- Call `useRemoteConfigStore.getState().fetchConfig()` and `startPolling()` on app mount

## Key Design Decisions

- **No persistence**: Remote config is fetched fresh each session — no localStorage. This ensures changes propagate within 30 min.
- **Local overrides remote**: The remote config sets defaults and kill-switches. User's explicit local settings (difficulty, rule toggles) always take precedence. The only exception is `adsEnabled: false` which acts as a global kill-switch.
- **Safe parsing**: `interstitialFrequency` string is parsed with regex; any malformed value falls back to `capped=1, cooldown=120s`.
- **No new dependencies**: Uses native `fetch` and `setInterval`.

