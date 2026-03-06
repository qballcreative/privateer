import { useState } from 'react';
import { useConsentStore } from '@/store/consentStore';
import { createAdProvider, requestRewarded } from '@/lib/adProvider';
import { emitAdEvent } from '@/lib/adAnalytics';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

interface RewardedAdProps {
  /** Called when user completes the rewarded ad */
  onRewardGranted: () => void;
}

/**
 * User-initiated rewarded ad button for treasure chest reveals.
 * Only visible when ads are enabled and not yet claimed.
 */
export const RewardedAd = ({ onRewardGranted }: RewardedAdProps) => {
  const shouldShowAds = useConsentStore((s) => s.shouldShowRewarded());
  const personalized = useConsentStore((s) => s.personalizedAds);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!shouldShowAds || claimed) return null;

  const handleWatch = async () => {
    setLoading(true);
    const provider = createAdProvider(personalized);
    const completed = await requestRewarded(provider);
    setLoading(false);

    if (completed) {
      setClaimed(true);
      emitAdEvent('ad_reward_granted', { placement: 'treasure_chest' });
      onRewardGranted();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleWatch}
      disabled={loading}
      className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
    >
      <Gift className="w-4 h-4" />
      {loading ? 'Loading…' : 'Watch ad for bonus'}
    </Button>
  );
};
