/**
 * Consent-aware analytics emitter for ad events.
 * Suppresses all events when restrictedMode is on or ageGroup is under13.
 */
import { useConsentStore } from '@/store/consentStore';

export type AdEvent = 'ad_impression' | 'ad_click' | 'ad_reward_granted';

export function emitAdEvent(event: AdEvent, data?: Record<string, unknown>) {
  const { restrictedMode, ageGroup, adsEnabled } = useConsentStore.getState();

  // Suppress analytics for restricted/under-13 users
  if (restrictedMode || ageGroup === 'under13' || !adsEnabled) return;

  // In production, forward to your analytics provider here.
  // For now, log in development only.
  if (import.meta.env.DEV) {
    console.log(`[AdAnalytics] ${event}`, data);
  }
}
