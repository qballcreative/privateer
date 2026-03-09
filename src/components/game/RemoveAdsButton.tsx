import { useConsentStore } from '@/store/consentStore';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    NativeIAP?: {
      purchase?: (productId: string) => Promise<boolean>;
    };
  }
}

/**
 * Premium CTA to purchase ad-free experience.
 * Only visible on mobile/tablet when ads are active and not already purchased.
 */
export const RemoveAdsButton = ({ compact = false }: { compact?: boolean }) => {
  const canRemove = useConsentStore((s) => s.canRemoveAds());
  const setPaidAdFree = useConsentStore((s) => s.setPaidAdFree);

  if (!canRemove) return null;

  const handlePurchase = async () => {
    if (window.NativeIAP?.purchase) {
      try {
        const success = await window.NativeIAP.purchase('remove_ads');
        if (success) {
          setPaidAdFree(true);
          toast({ title: 'Ads removed!', description: 'Enjoy an ad-free experience, Captain.' });
        }
      } catch {
        toast({ title: 'Purchase failed', description: 'Please try again later.', variant: 'destructive' });
      }
    } else {
      // Web fallback — IAP not available
      toast({
        title: 'Available in the app',
        description: 'Download the Privateer app to remove ads.',
      });
    }
  };

  if (compact) {
    return (
      <button
        onClick={handlePurchase}
        className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
      >
        Remove Ads
      </button>
    );
  }

  return (
    <Button
      variant="gold"
      size="lg"
      onClick={handlePurchase}
      className="w-full gap-2"
    >
      <Crown className="w-5 h-5" />
      Remove Ads — $2.99
    </Button>
  );
};
