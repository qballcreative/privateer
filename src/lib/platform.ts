/**
 * Platform detection and native adapter routing.
 * Detects web / PWA / Capacitor and provides adapter interfaces
 * for haptics and other native features (no-op on web).
 */

export type PlatformType = 'web' | 'pwa' | 'capacitor';

export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'web';
  if ((window as any).Capacitor) return 'capacitor';
  if (window.matchMedia?.('(display-mode: standalone)').matches) return 'pwa';
  return 'web';
}

// ── Haptics Adapter ───────────────────────────────────────────

export interface HapticsAdapter {
  triggerHaptic(type: 'light' | 'medium' | 'heavy'): void;
}

class WebHapticsAdapter implements HapticsAdapter {
  triggerHaptic(_type: 'light' | 'medium' | 'heavy') {
    // no-op on web/PWA
  }
}

class CapacitorHapticsAdapter implements HapticsAdapter {
  triggerHaptic(type: 'light' | 'medium' | 'heavy') {
    try {
      const style = type === 'light' ? 'LIGHT' : type === 'medium' ? 'MEDIUM' : 'HEAVY';
      (window as any).Capacitor?.Plugins?.Haptics?.impact?.({ style });
    } catch {
      // silent fallback
    }
  }
}

// ── Native Adapter ────────────────────────────────────────────

export interface NativeAdapter {
  type: PlatformType;
  haptics: HapticsAdapter;
  isNative: boolean;
  isPWA: boolean;
}

function createNativeAdapter(): NativeAdapter {
  const type = detectPlatform();
  const haptics = type === 'capacitor' ? new CapacitorHapticsAdapter() : new WebHapticsAdapter();

  return {
    type,
    haptics,
    isNative: type === 'capacitor',
    isPWA: type === 'pwa',
  };
}

/** Singleton platform adapter — safe to import anywhere */
export const platform = createNativeAdapter();
