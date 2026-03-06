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
export function createAdProvider(_personalized: boolean): AdProvider {
  if (typeof window !== 'undefined' && window.NativeAds) {
    return new NativeBridgeProvider();
  }
  return new NoopAdProvider();
}

// ── Cooldown Manager ──────────────────────────────────────────
const INTERSTITIAL_COOLDOWN_MS = 120_000; // 120 seconds
let lastInterstitialTime = 0;

export async function requestInterstitial(provider: AdProvider): Promise<boolean> {
  const now = Date.now();
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) return false;
  const shown = await provider.showInterstitial();
  if (shown) lastInterstitialTime = now;
  return shown;
}

export async function requestRewarded(provider: AdProvider): Promise<boolean> {
  return provider.showRewarded();
}
