import { useConsentStore } from '@/store/consentStore';

/**
 * Lobby-only ad banner. Always reserves vertical space to prevent layout shift.
 * Only fills with ad content when ads are enabled and not paid.
 */
export const AdBanner = () => {
  const shouldShow = useConsentStore((s) => s.shouldShowAds());

  return (
    <div className="w-full h-[90px] flex items-center justify-center bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
      {shouldShow ? (
        // Placeholder for actual ad content — will be filled by native bridge or ad SDK
        <span className="text-xs text-muted-foreground/50 select-none">Ad Space</span>
      ) : null}
    </div>
  );
};
