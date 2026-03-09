import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRemoteConfigStore } from './remoteConfigStore';
import { platform } from '@/lib/platform';

export type AgeGroup = 'under13' | '13-15' | '16-17' | '18+';

interface ConsentState {
  ageGroup: AgeGroup | null;
  adsEnabled: boolean;
  personalizedAds: boolean;
  paidAdFree: boolean;
  restrictedMode: boolean;
  hasConsented: boolean;

  // Derived
  shouldShowAds: () => boolean;
  shouldShowRewarded: () => boolean;
  /** Returns true only on native app (Capacitor) where IAP is available */
  canRemoveAds: () => boolean;

  // Actions
  setConsent: (ageGroup: AgeGroup, personalizedAds: boolean) => void;
  setPaidAdFree: (paid: boolean) => void;
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
        // Web: always show ads (no removal option)
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
          adsEnabled: !isUnder13,
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
