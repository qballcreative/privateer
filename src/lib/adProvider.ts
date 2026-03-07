/**
 * Ad Provider abstraction — safe no-op by default, with a native bridge path for future use.
 */

export interface AdProvider {
  showBanner(): void;
  hideBanner(): void;
  showInterstitial(): Promise<boolean>;
  showRewarded(): Promise<boolean>;
}

// ── Noop Provider ──────────────────────────────────────────────
export class NoopAdProvider implements AdProvider {
  showBanner() {}
  hideBanner() {}
  async showInterstitial() { return false; }
  async showRewarded() { return false; }
}

// ── Native Bridge Provider (future) ───────────────────────────
declare global {
  interface Window {
    NativeAds?: {
      showBanner?: () => void;
      hideBanner?: () => void;
      showInterstitial?: () => Promise<boolean>;
      showRewarded?: () => Promise<boolean>;
    };
  }
}

export class NativeBridgeProvider implements AdProvider {
  private fallback = new NoopAdProvider();

  showBanner() {
    try { window.NativeAds?.showBanner?.(); } catch { this.fallback.showBanner(); }
  }
  hideBanner() {
    try { window.NativeAds?.hideBanner?.(); } catch { this.fallback.hideBanner(); }
  }
  async showInterstitial() {
    try {
      return (await window.NativeAds?.showInterstitial?.()) ?? false;
    } catch { return false; }
  }
  async showRewarded() {
    try {
      return (await window.NativeAds?.showRewarded?.()) ?? false;
    } catch { return false; }
  }
}

// ── Factory ───────────────────────────────────────────────────
import { platform } from '@/lib/platform';

export function createAdProvider(_personalized: boolean): AdProvider {
  if (platform.isNative && typeof window !== 'undefined' && window.NativeAds) {
    return new NativeBridgeProvider();
  }
  return new NoopAdProvider();
}

// ── Cooldown Manager ──────────────────────────────────────────
import { useRemoteConfigStore, parseInterstitialFrequency } from '@/store/remoteConfigStore';
import { debugLog } from '@/lib/debugLog';

let lastInterstitialTime = 0;

export async function requestInterstitial(provider: AdProvider): Promise<boolean> {
  const { interstitialFrequency } = useRemoteConfigStore.getState().config;
  const { cooldownMs } = parseInterstitialFrequency(interstitialFrequency);

  const now = Date.now();
  const elapsed = now - lastInterstitialTime;
  if (elapsed < cooldownMs) {
    debugLog('ads', 'interstitial suppressed', `cooldown: ${Math.round((cooldownMs - elapsed) / 1000)}s remaining`);
    return false;
  }
  const shown = await provider.showInterstitial();
  if (shown) {
    lastInterstitialTime = now;
    debugLog('ads', 'interstitial shown');
  } else {
    debugLog('ads', 'interstitial not shown', 'provider returned false');
  }
  return shown;
}

/** Global remote kill-switch for ads */
export function isAdsRemoteEnabled(): boolean {
  return useRemoteConfigStore.getState().config.adsEnabled;
}

export async function requestRewarded(provider: AdProvider): Promise<boolean> {
  return provider.showRewarded();
}
