import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsentStore } from '@/store/consentStore';
import { createAdProvider, requestInterstitial } from '@/lib/adProvider';
import { emitAdEvent } from '@/lib/adAnalytics';
import { platform } from '@/lib/platform';
import { RemoveAdsButton } from './RemoveAdsButton';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface InterstitialAdProps {
  trigger: boolean;
  round: number;
}

/**
 * Static interstitial ad shown at round-end on ALL platforms.
 * On native app: shows "Remove Ads" nudge after closing.
 * On web: no removal option.
 */
export const InterstitialAd = ({ trigger, round }: InterstitialAdProps) => {
  const shouldShowAds = useConsentStore((s) => s.shouldShowAds());
  const canRemove = useConsentStore((s) => s.canRemoveAds());
  const personalized = useConsentStore((s) => s.personalizedAds);
  const [visible, setVisible] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const shownForRoundRef = useRef<number>(-1);

  useEffect(() => {
    if (!trigger || !shouldShowAds || shownForRoundRef.current === round) return;

    const provider = createAdProvider(personalized);
    requestInterstitial(provider).then((shown) => {
      if (shown) {
        shownForRoundRef.current = round;
        setVisible(true);
        emitAdEvent('ad_impression', { placement: 'interstitial', round });
      }
    });
  }, [trigger, round, shouldShowAds, personalized]);

  const handleClose = () => {
    setVisible(false);
    // Show remove-ads nudge only on native app
    if (canRemove) {
      setShowNudge(true);
      setTimeout(() => setShowNudge(false), 5000);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 text-center shadow-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <p className="text-xs text-muted-foreground mb-4">Advertisement</p>
            <div className="h-[250px] bg-muted/30 rounded-lg flex items-center justify-center mb-4 border border-border/50">
              <span className="text-muted-foreground/40 text-sm">Ad Content</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
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