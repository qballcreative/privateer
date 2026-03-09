import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRemoteConfigStore } from './remoteConfigStore';

export type AgeGroup = 'under13' | '13-15' | '16-17' | '18+';

/** Returns true when the viewport is desktop-sized (lg+) */
function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.innerWidth >= 1024;
}

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
  /** Returns true if the current platform allows the user to purchase ad-free (mobile/tablet only) */
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
        // Desktop: always show ads (no paid removal)
        if (isDesktop()) return true;
        // Mobile/tablet: respect paidAdFree
        return !s.paidAdFree;
      },

      shouldShowRewarded: () => {
        const s = get();
        const rc = useRemoteConfigStore.getState().config;
        if (!s.adsEnabled || !rc.adsEnabled || !rc.rewardedEnabled) return false;
        if (isDesktop()) return true;
        return !s.paidAdFree;
      },

      canRemoveAds: () => {
        const s = get();
        // Only mobile/tablet users who have ads enabled and haven't already paid
        return s.adsEnabled && !s.paidAdFree && !isDesktop();
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
