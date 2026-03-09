import { useConsentStore } from '@/store/consentStore';

/**
 * Fixed-position 50px banner ad for mobile/tablet gameplay.
 * Only renders when ads are enabled and not paid ad-free.
 */
export const AdBottomBanner = () => {
  const shouldShow = useConsentStore((s) => s.shouldShowAds());

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-[50px] flex items-center justify-center bg-card/95 border-t border-border/50 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Placeholder — filled by native bridge or ad SDK */}
      <span className="text-[10px] text-muted-foreground/40 select-none">Ad Space (320×50)</span>
    </div>
  );
};
