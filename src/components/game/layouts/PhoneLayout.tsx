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
import { LayoutProps, GOODS_ORDER } from './types';

export const PhoneLayout = ({
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

  // Auto-open drawers/sections when tutorial targets elements inside them (phone only)
  useEffect(() => {
    if (!tutorialActive || !currentHighlightId) return;
    // Only run on phone-sized screens to avoid opening drawers on tablet/desktop
    if (window.innerWidth >= 768) return;

    if (TREASURE_DRAWER_STEPS.includes(currentHighlightId)) {
      setTreasureDrawerOpen(true);
    }
    if (TRADING_POST_STEPS.includes(currentHighlightId)) {
      setTradingPostCollapsed(false);
    }
  }, [tutorialActive, currentHighlightId]);

  // Force hold visible during tutorial
  const forceShowHold = tutorialActive && currentHighlightId && HOLD_STEPS.includes(currentHighlightId);

  return (
  <div className="block md:hidden space-y-3">
    {/* Mini scoreboard bar */}
    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-card/60 border border-border text-xs">
      <div className="flex items-center gap-1.5">
        <Coins className="w-3 h-3 text-primary" />
        <span className="text-foreground font-medium">{humanPlayer?.name?.split(' ')[0]}</span>
        <span className="text-primary font-pirate">{calculateScore(humanPlayer, players)}</span>
      </div>
      <span className="text-muted-foreground">vs</span>
      <div className="flex items-center gap-1.5">
        <span className="text-foreground font-medium">{opponentPlayer?.name?.split(' ')[0]}</span>
        <span className="text-accent font-pirate">{calculateScore(opponentPlayer!, players)}</span>
      </div>
    </div>

    {/* Mini-info bar */}
    <div className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-card/80 border border-border text-[10px]">
      <div className="flex items-center gap-1">
        <img src="/images/supply.webp" alt="Supply" className="w-4 h-4 object-contain" />
        <span className="text-muted-foreground">{deck.length}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {GOODS_ORDER.map((type) => {
          const isEmpty = tokenStacks[type].length === 0;
          return (
            <div
              key={type}
              className={cn("w-3 h-3 rounded-sm", isEmpty ? "bg-destructive/40" : "bg-primary/20")}
              title={`${type}: ${tokenStacks[type].length} left`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        <img src="/images/fleet.png" alt="Fleet" className="w-4 h-4 object-contain" />
        <span className="text-accent">{opponentPlayer?.ships.length || 0}</span>
      </div>
    </div>

    {/* Drawer triggers */}
    <div className="flex items-center justify-between gap-2">
      <Sheet open={treasureDrawerOpen} onOpenChange={setTreasureDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-primary/30 text-primary">
            <Coins className="w-4 h-4" />
            <span className="text-xs">Treasure</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-sm bg-card border-primary/20 p-4 overflow-y-auto">
          <SheetTitle className="font-pirate text-primary text-lg mb-4">Treasure Supply</SheetTitle>
          <TreasureSupplyPanel compact {...treasureSupplyProps} isRaidMode={isRaidMode} setIsRaidMode={setIsRaidMode} />
        </SheetContent>
      </Sheet>

      {optionalRules.stormRule && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] text-blue-400">{3 - (turnCount % 3)} to storm</span>
        </div>
      )}

      <Sheet open={opponentDrawerOpen} onOpenChange={setOpponentDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-accent/30 text-accent">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Opponent</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/20 text-[10px] font-bold">
              {opponentPlayer?.hand.length}/{7}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85vw] max-w-sm bg-card border-accent/20 p-4 overflow-y-auto">
          <SheetTitle className="font-pirate text-accent text-lg mb-4">Opponent & Ledger</SheetTitle>
          <OpponentPanel {...opponentPanelProps} />
        </SheetContent>
      </Sheet>
    </div>

    {/* Trading Post — collapsible */}
    <div className="space-y-1">
      <button
        onClick={() => setTradingPostCollapsed(!tradingPostCollapsed)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-card/50 border border-border text-sm"
      >
        <span className="font-pirate text-primary text-sm">Trading Post</span>
        {tradingPostCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
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
            <TradingPost layout="phone" onModeChange={setIsExchangeMode} onInvalidAction={triggerInvalidAction} />
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
            <ShipsHold player={humanPlayer} isCurrentPlayer={currentPlayerIndex === localPlayerIndex} layout="phone" />
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
