

## Ad Monetization Implementation Plan

### Strategy Summary

- **Desktop (lg+)**: Ads always visible, no option to remove. Sidebar banner ads alongside gameplay.
- **Tablet & Phone (< lg)**: Ads enabled by default. Interstitials between rounds + banner on lobby. Users can pay to remove all ads via an in-app purchase button.
- **Goal**: Mobile ads are frequent enough to be mildly annoying, driving conversions to the paid ad-free experience.

---

### Current State

Already built:
- `AdBanner` — lobby-only, 90px placeholder
- `InterstitialAd` — round-end modal with 120s cooldown
- `RewardedAd` — user-initiated for treasure chest bonus
- `ConsentStore` with `paidAdFree`, `shouldShowAds()`, age gate
- `RemoteConfig` with `adsEnabled` kill-switch
- `platform.ts` detecting web/pwa/capacitor

---

### Changes

#### 1. Update consent store: platform-aware ad logic

**File: `src/store/consentStore.ts`**

- Add a new derived method `canRemoveAds()` that returns `true` only on mobile/tablet (non-desktop screens or Capacitor/PWA).
- Update `shouldShowAds()`: on desktop (`window.innerWidth >= 1024`), always show ads regardless of `paidAdFree`. On mobile/tablet, respect `paidAdFree`.
- Desktop users never see "Remove Ads" options.

#### 2. Add persistent desktop sidebar ad

**File: `src/components/game/layouts/DesktopLayout.tsx`**

- Add a vertical ad banner (160x600 skyscraper format) below the ScoreBoard in the right sidebar.
- This ad is always visible during gameplay on desktop — not dismissible, not removable.
- Uses a new `SidebarAd` component.

**New file: `src/components/game/AdSidebar.tsx`**

- Renders a 160x600 vertical ad placeholder.
- Always visible on desktop, hidden on mobile/tablet.

#### 3. Add in-game banner ad for mobile/tablet

**File: `src/components/game/layouts/PhoneLayout.tsx`**  
**File: `src/components/game/layouts/TabletLayout.tsx`**

- Add a slim banner ad (320x50) pinned to the bottom of the game screen during gameplay.
- Only shown when `shouldShowAds()` is true (respects paidAdFree on mobile).
- Uses `position: fixed; bottom: 0` with safe-area padding.

**New file: `src/components/game/AdBottomBanner.tsx`**

- Fixed-position 50px banner at the bottom of the screen.
- Only renders on mobile/tablet when ads are enabled and not paid.

#### 4. Increase interstitial frequency on mobile

**File: `public/config/remote.json`**

- Reduce cooldown from 120s to 60s to make interstitials more frequent on mobile.
- Desktop interstitials remain suppressed (handled in code).

**File: `src/components/game/InterstitialAd.tsx`**

- Add platform check: skip interstitials on desktop (lg+) since they already have persistent sidebar ads.
- On mobile/tablet, show interstitials at round-end as before but with the shorter cooldown.

#### 5. Add "Remove Ads" purchase button

**New file: `src/components/game/RemoveAdsButton.tsx`**

- A prominent button shown in the Settings panel and on the lobby page (mobile/tablet only).
- Styled as a gold/premium CTA: "Remove Ads — $2.99" (price is display-only; actual purchase goes through native IAP or future Polar integration).
- On click: calls `window.NativeIAP?.purchase('remove_ads')` if available (Capacitor), otherwise shows a toast explaining it's available in the app.
- On successful purchase: calls `useConsentStore.getState().setPaidAdFree(true)`.

#### 6. Add "Remove Ads" to Settings panel

**File: `src/components/game/SettingsPanel.tsx`**

- Add a "Remove Ads" section at the bottom of settings, only visible on mobile/tablet and when not already paid.
- Shows the `RemoveAdsButton` component.

#### 7. Add "Remove Ads" CTA to lobby page

**File: `src/components/game/LandingPage.tsx`**

- On mobile/tablet, show a subtle but visible "Remove Ads" banner near the AdBanner at the bottom.
- Only shown when `canRemoveAds()` is true and not already paid.

#### 8. Add "Remove Ads" prompt after interstitials

**File: `src/components/game/InterstitialAd.tsx`**

- After closing an interstitial on mobile/tablet, briefly show a "Tired of ads? Remove them" link that triggers the purchase flow.
- This is the key conversion nudge.

---

### Ad Placement Summary

```text
┌─────────────────────────────────────────────┐
│                  DESKTOP                     │
│  ┌──────┐  ┌────────────────┐  ┌──────────┐│
│  │Treas.│  │  Trading Post  │  │ Opponent ││
│  │      │  │  Ship's Hold   │  │ Score    ││
│  │      │  │                │  │ ──────── ││
│  │      │  │                │  │ AD 160x  ││
│  │      │  │                │  │ 600      ││
│  └──────┘  └────────────────┘  └──────────┘│
│  Ads: Sidebar always on. No remove option.  │
└─────────────────────────────────────────────┘

┌───────────────────────┐
│    PHONE / TABLET     │
│  ┌─────────────────┐  │
│  │  Game Content    │  │
│  │                  │  │
│  │                  │  │
│  └─────────────────┘  │
│  ┌─────────────────┐  │
│  │  AD BANNER 50px │  │  ← fixed bottom
│  └─────────────────┘  │
│  + Interstitial @60s  │
│  + "Remove Ads" CTA   │
└───────────────────────┘
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/store/consentStore.ts` | Add `canRemoveAds()`, platform-aware `shouldShowAds()` |
| `src/components/game/AdSidebar.tsx` | New — 160x600 desktop sidebar ad |
| `src/components/game/AdBottomBanner.tsx` | New — fixed bottom banner for mobile/tablet |
| `src/components/game/RemoveAdsButton.tsx` | New — purchase CTA component |
| `src/components/game/layouts/DesktopLayout.tsx` | Add sidebar ad below ScoreBoard |
| `src/components/game/layouts/PhoneLayout.tsx` | Add bottom banner |
| `src/components/game/layouts/TabletLayout.tsx` | Add bottom banner |
| `src/components/game/InterstitialAd.tsx` | Skip on desktop, add post-close "Remove Ads" nudge |
| `src/components/game/SettingsPanel.tsx` | Add Remove Ads section |
| `src/components/game/LandingPage.tsx` | Add Remove Ads CTA near lobby ad |
| `public/config/remote.json` | Reduce cooldown to 60s |

