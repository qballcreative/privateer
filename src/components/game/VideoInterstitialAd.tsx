import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsentStore } from '@/store/consentStore';
import { useRemoteConfigStore } from '@/store/remoteConfigStore';
import { emitAdEvent } from '@/lib/adAnalytics';
import { platform } from '@/lib/platform';
import { RemoveAdsButton } from './RemoveAdsButton';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';

interface VideoInterstitialAdProps {
  trigger: boolean;
  round: number;
}

const SKIP_DELAY_SECONDS = 5;

/**
 * Full-screen video interstitial shown between rounds.
 * Features a countdown before the skip button becomes available.
 * On native app: shows "Remove Ads" nudge after closing.
 * On web: no removal option.
 */
export const VideoInterstitialAd = ({ trigger, round }: VideoInterstitialAdProps) => {
  const shouldShowAds = useConsentStore((s) => s.shouldShowAds());
  const canRemove = useConsentStore((s) => s.canRemoveAds());
  const videoEnabled = useRemoteConfigStore((s) => s.config.videoInterstitialEnabled);
  const [visible, setVisible] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [countdown, setCountdown] = useState(SKIP_DELAY_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const shownForRoundRef = useRef<number>(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!trigger || !shouldShowAds || !videoEnabled || shownForRoundRef.current === round) return;

    shownForRoundRef.current = round;
    setVisible(true);
    setCountdown(SKIP_DELAY_SECONDS);
    setCanSkip(false);
    emitAdEvent('ad_impression', { placement: 'video_interstitial', round });
  }, [trigger, round, shouldShowAds, videoEnabled]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // Show remove-ads nudge only on native app
    if (canRemove) {
      setShowNudge(true);
      setTimeout(() => setShowNudge(false), 5000);
    }
  }, [canRemove]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
              <p className="text-xs text-muted-foreground">Advertisement</p>
              {canSkip ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="gap-1 text-xs h-7"
                >
                  <X className="w-3 h-3" />
                  Skip
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground/60">
                  Skip in {countdown}s
                </span>
              )}
            </div>

            {/* Video placeholder */}
            <div className="relative aspect-video bg-muted/20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border border-border/50">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <span className="text-sm">Video Ad Content</span>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
                <motion.div
                  className="h-full bg-primary/60"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SKIP_DELAY_SECONDS, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 flex items-center justify-center">
              {canRemove ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Enjoy ad-free gameplay</span>
                  <RemoveAdsButton compact />
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/40">
                  Ad will close after video ends
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Post-close "Remove Ads" nudge — native app only */}
      {showNudge && !visible && (
        <motion.div
          className="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="bg-card border border-primary/30 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Tired of ads?</span>
            <RemoveAdsButton compact />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
