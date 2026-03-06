import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRemoteConfigStore } from './remoteConfigStore';

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
        // Check remote kill-switch
        const remoteEnabled = useRemoteConfigStore.getState().config.adsEnabled;
        return s.adsEnabled && !s.paidAdFree && remoteEnabled;
      },

      shouldShowRewarded: () => {
        const s = get();
        const rc = useRemoteConfigStore.getState().config;
        return s.adsEnabled && !s.paidAdFree && rc.adsEnabled && rc.rewardedEnabled;
      },

      setConsent: (ageGroup, personalizedAds) => {
        const isUnder13 = ageGroup === 'under13';
        const is18Plus = ageGroup === '18+';

        set({
          ageGroup,
          hasConsented: true,
          restrictedMode: isUnder13,
          adsEnabled: !isUnder13,
          // Personalization only for 18+ and only if explicitly opted in
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
