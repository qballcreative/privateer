/**
 * Consent Store — Age Verification & Ad Preferences
 *
 * Manages COPPA-compliant age gating and ad consent. Users must select
 * an age group before ads are shown. Under-13 users enter restricted mode
 * (no ads, no personalization). Ad removal via IAP is only available on
 * native (Capacitor) builds.
 *
 * Persisted under the key 'privateer-consent'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRemoteConfigStore } from './remoteConfigStore';
import { platform } from '@/lib/platform';

/** Age brackets for COPPA-compliant consent flow. */
export type AgeGroup = 'under13' | '13-15' | '16-17' | '18+';

interface ConsentState {
  /** User's declared age group (null = not yet asked). */
  ageGroup: AgeGroup | null;
  /** Whether ads are enabled based on age and consent. */
  adsEnabled: boolean;
  /** Whether the user consented to personalized (targeted) ads (18+ only). */
  personalizedAds: boolean;
  /** Whether the user purchased ad-free via in-app purchase (native only). */
  paidAdFree: boolean;
  /** COPPA restricted mode — true for under-13 users. */
  restrictedMode: boolean;
  /** Whether the consent flow has been completed at least once. */
  hasConsented: boolean;

  // ─── Derived Selectors ──────────────────────────────────────────
  /** Whether ads should currently be displayed (considers remote config, consent, and IAP). */
  shouldShowAds: () => boolean;
  /** Whether rewarded ads should be offered (additional remote config check). */
  shouldShowRewarded: () => boolean;
  /** Whether the "Remove Ads" IAP option is available (native app only). */
  canRemoveAds: () => boolean;

  // ─── Actions ────────────────────────────────────────────────────
  /** Set consent after age verification — configures ads and restricted mode. */
  setConsent: (ageGroup: AgeGroup, personalizedAds: boolean) => void;
  /** Mark ads as removed via IAP purchase. */
  setPaidAdFree: (paid: boolean) => void;
  /** Reset all consent data (e.g., for testing or re-verification). */
  resetConsent: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set, get) => ({
      ageGroup: null,
      adsEnabled: false,
      personalizedAds: false,
      paidAdFree: false,
      restrictedMode: false,
      hasConsented: false,

      shouldShowAds: () => {
        const s = get();
        const remoteEnabled = useRemoteConfigStore.getState().config.adsEnabled;
        if (!s.adsEnabled || !remoteEnabled) return false;
        // Web: always show ads (no IAP removal option)
        if (!platform.isNative) return true;
        // Native app: respect IAP paid status
        return !s.paidAdFree;
      },

      shouldShowRewarded: () => {
        const s = get();
        const rc = useRemoteConfigStore.getState().config;
        if (!s.adsEnabled || !rc.adsEnabled || !rc.rewardedEnabled) return false;
        if (!platform.isNative) return true;
        return !s.paidAdFree;
      },

      canRemoveAds: () => {
        const s = get();
        // Only native app users can purchase ad-free via IAP
        return s.adsEnabled && !s.paidAdFree && platform.isNative;
      },

      setConsent: (ageGroup, personalizedAds) => {
        const isUnder13 = ageGroup === 'under13';
        const is18Plus = ageGroup === '18+';

        set({
          ageGroup,
          hasConsented: true,
          restrictedMode: isUnder13,
          // Disable ads entirely for under-13 (COPPA compliance)
          adsEnabled: !isUnder13,
          // Only allow personalized ads for 18+ users who opted in
          personalizedAds: is18Plus ? personalizedAds : false,
        });
      },

      setPaidAdFree: (paid) => set({ paidAdFree: paid }),

      resetConsent: () =>
        set({
          ageGroup: null,
          adsEnabled: false,
          personalizedAds: false,
          paidAdFree: false,
          restrictedMode: false,
          hasConsented: false,
        }),
    }),
    {
      name: 'privateer-consent',
    }
  )
);
