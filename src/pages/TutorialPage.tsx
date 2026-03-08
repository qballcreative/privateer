import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tutorial } from '@/components/game/Tutorial';
import { useTutorialStore } from '@/store/tutorialStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import bannerLogo from '@/assets/BannerLogo.png';

/**
 * Hotspot regions positioned as percentages over each screenshot.
 * Each key matches a `data-tutorial-id` used in tutorialStore steps.
 */
interface HotspotRect {
  top: string;
  left: string;
  width: string;
  height: string;
}

type HotspotMap = Record<string, HotspotRect>;

// Desktop (1920×1080 image) — 3-column layout
const DESKTOP_HOTSPOTS: HotspotMap = {
  'tutorial-actions':       { top: '0%',  left: '15%', width: '70%', height: '10%' },
  'tutorial-trading-post':  { top: '12%', left: '25%', width: '50%', height: '45%' },
  'tutorial-ships-hold':    { top: '55%', left: '25%', width: '50%', height: '40%' },
  'tutorial-market-prices': { top: '10%', left: '0%',  width: '23%', height: '85%' },
  'tutorial-bonus':         { top: '10%', left: '77%', width: '23%', height: '45%' },
  'tutorial-storm':         { top: '85%', left: '0%',  width: '8%',  height: '10%' },
  'tutorial-raid':          { top: '85%', left: '8%',  width: '8%',  height: '10%' },
  'tutorial-treasure':      { top: '85%', left: '16%', width: '8%',  height: '10%' },
};

// Tablet (768×1024 image) — 3-column layout
const TABLET_HOTSPOTS: HotspotMap = {
  'tutorial-actions':       { top: '0%',  left: '10%', width: '80%', height: '8%' },
  'tutorial-trading-post':  { top: '10%', left: '20%', width: '45%', height: '40%' },
  'tutorial-ships-hold':    { top: '50%', left: '20%', width: '45%', height: '35%' },
  'tutorial-market-prices': { top: '10%', left: '65%', width: '35%', height: '50%' },
  'tutorial-bonus':         { top: '60%', left: '65%', width: '35%', height: '20%' },
  'tutorial-storm':         { top: '85%', left: '65%', width: '12%', height: '8%' },
  'tutorial-raid':          { top: '85%', left: '77%', width: '12%', height: '8%' },
  'tutorial-treasure':      { top: '85%', left: '89%', width: '11%', height: '8%' },
};

// Mobile (512×1024 image) — single column stacked
const MOBILE_HOTSPOTS: HotspotMap = {
  'tutorial-actions':       { top: '5%',  left: '5%',  width: '90%', height: '6%' },
  'tutorial-trading-post':  { top: '12%', left: '5%',  width: '90%', height: '25%' },
  'tutorial-ships-hold':    { top: '38%', left: '5%',  width: '90%', height: '25%' },
  'tutorial-market-prices': { top: '64%', left: '5%',  width: '90%', height: '20%' },
  'tutorial-bonus':         { top: '85%', left: '5%',  width: '90%', height: '10%' },
  'tutorial-storm':         { top: '95%', left: '5%',  width: '30%', height: '5%' },
  'tutorial-raid':          { top: '95%', left: '35%', width: '30%', height: '5%' },
  'tutorial-treasure':      { top: '95%', left: '65%', width: '30%', height: '5%' },
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const IMAGES: Record<Breakpoint, string> = {
  mobile:  '/images/tutorial/game-mobile.png',
  tablet:  '/images/tutorial/game-tablet.png',
  desktop: '/images/tutorial/game-desktop.png',
};

const HOTSPOT_SETS: Record<Breakpoint, HotspotMap> = {
  mobile:  MOBILE_HOTSPOTS,
  tablet:  TABLET_HOTSPOTS,
  desktop: DESKTOP_HOTSPOTS,
};

function useBreakpoint(): Breakpoint {
  const isMobile = useIsMobile();
  // useIsMobile returns true for <768px
  if (isMobile) return 'mobile';
  // Check for tablet vs desktop
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

const TutorialPage = () => {
  const navigate = useNavigate();
  const { isActive, start, skip } = useTutorialStore();
  const hasStarted = useRef(false);
  const breakpoint = useBreakpoint();

  const imageSrc = IMAGES[breakpoint];
  const hotspots = HOTSPOT_SETS[breakpoint];

  // Start tutorial on mount (no game state needed)
  useEffect(() => {
    start();
    hasStarted.current = true;
  }, []);

  // Navigate home when tutorial ends
  useEffect(() => {
    if (hasStarted.current && !isActive) {
      const t = setTimeout(() => navigate('/'), 200);
      return () => clearTimeout(t);
    }
  }, [isActive, navigate]);

  return (
    <div
      className="min-h-screen w-screen overflow-y-auto flex flex-col bg-background"
      style={{ backgroundImage: 'url(/images/wood-bg.png)', backgroundSize: '100% auto', backgroundRepeat: 'repeat-y' }}
    >
      {/* Tutorial overlay */}
      <Tutorial />

      {/* Header */}
      <header className="flex items-center justify-between py-2 px-4 border-b border-border bg-card/80 flex-shrink-0 z-10 pointer-events-auto">
        <img src={bannerLogo} alt="Privateer" className="h-8 object-contain" />
        <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
          <X className="w-4 h-4 mr-1" /> Skip
        </Button>
      </header>

      {/* Game board screenshot with hotspot overlays */}
      <div className="flex-1 relative">
        {/* Screenshot image */}
        <img
          src={imageSrc}
          alt="Game board preview"
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Transparent hotspot overlays for tutorial spotlight targeting */}
        {Object.entries(hotspots).map(([id, rect]) => (
          <div
            key={id}
            data-tutorial-id={id}
            className="absolute pointer-events-none"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TutorialPage;
