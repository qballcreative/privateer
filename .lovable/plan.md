

## Plan: Platform-Aware Ads + Video Interstitial Between Matches

### Clarification of Requirements

1. **Website (web browser)**: All ads always shown, no option to remove. Same as current desktop behavior, but extended to all web visitors regardless of screen size.
2. **Native app (Capacitor)**: Ads shown by default, with IAP to remove. Current mobile behavior is correct for this.
3. **Video ad between matches**: A new video interstitial that plays between rounds (replaces or supplements the current static interstitial).

### Changes

#### 1. Update platform detection in consent store

**File: `src/store/consentStore.ts`**

Current logic uses `window.innerWidth >= 1024` to determine desktop. This needs to change:
- **`canRemoveAds()`**: Should return `true` only when running inside Capacitor (`platform.isNative`), not based on screen size. Web users of any size cannot remove ads.
- **`shouldShowAds()`**: On web (`!platform.isNative`), always show ads (no paid removal). On native app, respect `paidAdFree`.
- **`shouldShowRewarded()`**: Same platform-based logic.

Import `platform` from `@/lib/platform` and replace all `isDesktop()` checks with `platform.isNative` checks.

#### 2. Update InterstitialAd to show on all platforms + add video format

**File: `src/components/game/InterstitialAd.tsx`**

- Remove the desktop skip (`window.innerWidth >= 1024` check). Interstitials should show on all platforms.
- On web (non-native), skip the "Remove Ads" nudge since web users can't remove ads.
- Add a video ad variant: alternate between static and video interstitials, or always show video between rounds.
- Video placeholder: a `<video>` element with a placeholder source, a countdown timer (e.g., "Skip in 5s"), and a skip button that appears after the countdown.
- The video ad is more intrusive than the static one, making the IAP more appealing on mobile.

#### 3. New VideoInterstitialAd component

**New file: `src/components/game/VideoInterstitialAd.tsx`**

- Full-screen overlay with a video player placeholder.
- Shows "Advertisement" label, a countdown timer ("You can skip in Xs"), and a skip button after countdown.
- On native: shows "Remove Ads" nudge after closing.
- On web: no remove option, just closes.
- Triggered at round-end, alternating with or replacing the static interstitial.

#### 4. Update GameBoard to use video interstitial

**File: `src/components/game/GameBoard.tsx`**

- Replace or augment the `InterstitialAd` usage to include the video variant.
- Pass `phase === 'roundEnd'` trigger to the new video component.

#### 5. Update remote config

**File: `public/config/remote.json`**

- Add `videoInterstitialEnabled: true` flag for remote control.

#### 6. Update RemoveAdsButton visibility

**File: `src/components/game/RemoveAdsButton.tsx`**

- Already uses `canRemoveAds()` which will now be platform-based. No code changes needed — it will automatically hide on web and show only in the native app.

#### 7. Update AdSidebar / AdBottomBanner

These components already use `shouldShowAds()` which will now always return true on web. The sidebar ad stays on desktop-sized web, bottom banner stays on mobile-sized web. Both are non-removable on web. On native app, they respect `paidAdFree`. No changes needed to these components.

---

### Files Summary

| File | Action |
|------|--------|
| `src/store/consentStore.ts` | Replace `isDesktop()` with `platform.isNative` checks |
| `src/components/game/VideoInterstitialAd.tsx` | New — video ad with skip countdown |
| `src/components/game/InterstitialAd.tsx` | Remove desktop skip, show on all platforms |
| `src/components/game/GameBoard.tsx` | Add VideoInterstitialAd at round-end |
| `public/config/remote.json` | Add `videoInterstitialEnabled` flag |
| `src/store/remoteConfigStore.ts` | Add `videoInterstitialEnabled` to config type |

