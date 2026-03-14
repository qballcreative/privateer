import { useEffect } from 'react';
import { AdBottomBanner } from '../AdBottomBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateScore } from '@/store/gameStore';
import { useTutorialStore, TUTORIAL_STEPS } from '@/store/tutorialStore';
import { TREASURE_DRAWER_STEPS, TRADING_POST_STEPS, HOLD_STEPS } from '../Tutorial';
import { TradingPost } from '../TradingPost';
import { ShipsHold } from '../ShipsHold';
import { TreasureSupplyPanel } from './TreasureSupplyPanel';
import { OpponentPanel } from './OpponentPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Coins, CloudLightning, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LayoutProps, GOODS_ORDER, GOODS_IMAGES } from './types';

export const TabletLayout = ({
  treasureSupplyProps, opponentPanelProps, isRaidMode, setIsRaidMode,
  isExchangeMode, setIsExchangeMode, triggerInvalidAction,
  humanPlayer, opponentPlayer, currentPlayerIndex, localPlayerIndex,
  phase, deck, tokenStacks, turnCount, optionalRules,
  treasureDrawerOpen, setTreasureDrawerOpen,
  opponentDrawerOpen, setOpponentDrawerOpen,
  tradingPostCollapsed, setTradingPostCollapsed, players,
}: LayoutProps) => {
  const { isActive: tutorialActive, currentStep } = useTutorialStore();
  const currentHighlightId = tutorialActive ? TUTORIAL_STEPS[currentStep]?.highlightId : undefined;

  // Auto-open drawers/sections when tutorial targets elements inside them (tablet only)
  useEffect(() => {
    if (!tutorialActive || !currentHighlightId) return;
    // Only run on tablet-sized screens (768-1023px)
    if (window.innerWidth < 768 || window.innerWidth >= 1024) return;

    if (TREASURE_DRAWER_STEPS.includes(currentHighlightId)) {
      setTreasureDrawerOpen(true);
    }
    if (TRADING_POST_STEPS.includes(currentHighlightId)) {
      setTradingPostCollapsed(false);
    }
  }, [tutorialActive, currentHighlightId, setTreasureDrawerOpen, setTradingPostCollapsed]);

  // Force hold visible during tutorial
  const forceShowHold = tutorialActive && currentHighlightId && HOLD_STEPS.includes(currentHighlightId);

  return (
    <div className="hidden md:block lg:hidden space-y-4">
      {/* Mini scoreboard bar */}
      <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-card/60 border border-border text-sm">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">{humanPlayer?.name}</span>
          <span className="text-primary font-pirate text-lg">{calculateScore(humanPlayer, players)}</span>
        </div>
        <span className="text-muted-foreground">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{opponentPlayer?.name}</span>
          <span className="text-accent font-pirate text-lg">{calculateScore(opponentPlayer!, players)}</span>
        </div>
      </div>

      {/* Mini-info bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-card/80 border border-border text-xs">
        <div className="flex items-center gap-1.5">
          <img src="/images/supply.webp" alt="Supply" className="w-5 h-5 object-contain" />
          <span className="text-muted-foreground">{deck.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {GOODS_ORDER.map((type) => {
            const count = tokenStacks[type].length;
            const isEmpty = count === 0;
            return (
              <div
                key={type}
                className="relative group"
                title={`${type}: ${count} left`}
              >
                <img
                  src={GOODS_IMAGES[type]}
                  alt={type}
                  className={cn(
                    'w-6 h-6 object-contain transition-all',
                    isEmpty && 'grayscale opacity-40'
                  )}
                />
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-sm">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <img src="/images/fleet.webp" alt="Fleet" className="w-5 h-5 object-contain" />
          <span className="text-accent">{opponentPlayer?.ships.length || 0}</span>
        </div>
      </div>

      {/* Drawer triggers */}
      <div className="flex items-center justify-between gap-3">
        <Sheet modal={!tutorialActive} open={treasureDrawerOpen} onOpenChange={(open) => {
            if (!open && tutorialActive && currentHighlightId && TREASURE_DRAWER_STEPS.includes(currentHighlightId)) return;
            setTreasureDrawerOpen(open);
          }}>
          <SheetTrigger asChild>
            <Button variant="outline" size="default" className="flex items-center gap-2 border-primary/30 text-primary">
              <Coins className="w-5 h-5" />
              <span className="text-sm">Treasure</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[60vw] max-w-md bg-card border-primary/20 p-5 overflow-y-auto">
            <SheetTitle className="font-pirate text-primary text-xl mb-4">Treasure Supply</SheetTitle>
            <TreasureSupplyPanel compact {...treasureSupplyProps} />
          </SheetContent>
        </Sheet>

        {optionalRules.stormRule && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <CloudLightning className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">{3 - (turnCount % 3)} to storm</span>
          </div>
        )}

        <Sheet open={opponentDrawerOpen} onOpenChange={setOpponentDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="default" className="flex items-center gap-2 border-accent/30 text-accent">
              <Eye className="w-5 h-5" />
              <span className="text-sm">Opponent</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/20 text-xs font-bold">
                {opponentPlayer?.hand.length}/{7}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[60vw] max-w-md bg-card border-accent/20 p-5 overflow-y-auto">
            <SheetTitle className="font-pirate text-accent text-xl mb-4">Opponent & Ledger</SheetTitle>
            <OpponentPanel {...opponentPanelProps} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Trading Post — collapsible */}
      <div className="space-y-2">
        <button
          onClick={() => setTradingPostCollapsed(!tradingPostCollapsed)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-card/50 border border-border text-base"
        >
          <span className="font-pirate text-primary">Trading Post</span>
          {tradingPostCollapsed ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronUp className="w-5 h-5 text-muted-foreground" />}
        </button>
        <AnimatePresence initial={false}>
          {!tradingPostCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <TradingPost layout="tablet" onModeChange={setIsExchangeMode} onInvalidAction={triggerInvalidAction} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ship's Hold */}
      <AnimatePresence>
        {(!isExchangeMode || forceShowHold) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'overflow-hidden transition-all duration-400',
              phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed'
            )}
          >
            {humanPlayer && (
              <ShipsHold player={humanPlayer} isCurrentPlayer={currentPlayerIndex === localPlayerIndex} layout="tablet" />
            )}
          </motion.div>
      )}
    </AnimatePresence>

    {/* Fixed bottom ad banner */}
    <AdBottomBanner />
    {/* Spacer so content isn't hidden behind the fixed banner */}
    <div className="h-[50px]" />
    </div>
  );
};
