import { useConsentStore } from '@/store/consentStore';

/**
 * 160×600 skyscraper ad for the desktop sidebar.
 * Always visible on desktop — not dismissible, not removable.
 */
export const AdSidebar = () => {
  const shouldShow = useConsentStore((s) => s.shouldShowAds());

  if (!shouldShow) return null;

  return (
    <div className="w-full h-[600px] rounded-lg border border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden">
      {/* Placeholder — filled by native bridge or ad SDK */}
      <span className="text-xs text-muted-foreground/40 select-none writing-vertical">Ad Space (160×600)</span>
    </div>
  );
};
