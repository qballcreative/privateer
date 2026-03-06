import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsentStore } from '@/store/consentStore';
import { createAdProvider, requestInterstitial } from '@/lib/adProvider';
import { emitAdEvent } from '@/lib/adAnalytics';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface InterstitialAdProps {
  /** Should be true when phase === 'roundEnd' */
  trigger: boolean;
  /** Current round number — used to limit 1 per round */
  round: number;
}

/**
 * Shows at most 1 interstitial per round at round-end, with a 120s global cooldown.
 */
export const InterstitialAd = ({ trigger, round }: InterstitialAdProps) => {
  const shouldShowAds = useConsentStore((s) => s.shouldShowAds());
  const personalized = useConsentStore((s) => s.personalizedAds);
  const [visible, setVisible] = useState(false);
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
            {/* Placeholder for real ad content */}
            <div className="h-[250px] bg-muted/30 rounded-lg flex items-center justify-center mb-4 border border-border/50">
              <span className="text-muted-foreground/40 text-sm">Ad Content</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisible(false)}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
