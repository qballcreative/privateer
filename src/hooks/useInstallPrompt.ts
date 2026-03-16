/**
 * PWA Install Prompt Hook
 *
 * Captures the browser's `beforeinstallprompt` event and provides a
 * controlled way to trigger the native install dialog. Includes a
 * 7-day cooldown after the user dismisses the prompt to avoid nagging.
 *
 * Usage:
 *   const { canInstall, promptInstall, dismiss } = useInstallPrompt();
 *   if (canInstall) show install banner → onClick={promptInstall}
 */

import { useState, useEffect, useCallback } from 'react';

/** localStorage key for tracking when the user last dismissed the prompt. */
const DISMISS_KEY = 'privateer-install-dismissed';
/** Number of days to wait before showing the install prompt again after dismissal. */
const DISMISS_DAYS = 7;

/** Extended Event interface for the non-standard beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  /** The deferred prompt event captured from the browser. */
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  /** Whether the install prompt is available to show. */
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if the user recently dismissed the prompt (7-day cooldown)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Capture the browser's install prompt event and prevent the default banner
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /** Trigger the native install dialog. */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  /** Dismiss the prompt and start the cooldown timer. */
  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setCanInstall(false);
    setDeferredPrompt(null);
  }, []);

  return { canInstall, promptInstall, dismiss };
}
