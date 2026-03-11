import { motion, AnimatePresence } from 'framer-motion';
import { TradingPost } from '../TradingPost';
import { ShipsHold } from '../ShipsHold';
import { AdSidebar } from '../AdSidebar';
import { ScoreBoard } from '../ScoreBoard';
import { TreasureSupplyPanel } from './TreasureSupplyPanel';
import { Button } from '@/components/ui/button';
import { Crosshair, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LayoutProps } from './types';
import { useTutorialStore, TUTORIAL_STEPS } from '@/store/tutorialStore';

export const DesktopLayout = ({
  treasureSupplyProps, isRaidMode, setIsRaidMode,
  isExchangeMode, setIsExchangeMode, triggerInvalidAction,
  humanPlayer, opponentPlayer, currentPlayerIndex, localPlayerIndex, opponentIndex,
  phase, isOpponentPondering, handlePirateRaid, optionalRules,
}: LayoutProps) => {
  const tutorialActive = useTutorialStore((s) => s.isActive);
  const tutorialStep = useTutorialStore((s) => s.currentStep);
  const forceShowHold = tutorialActive && TUTORIAL_STEPS[tutorialStep]?.highlightId === 'tutorial-ships-hold';

  const canRaid = !humanPlayer.hasUsedPirateRaid && !humanPlayer.isAI;

  return (
  <div className="hidden lg:block">
    <div className="grid grid-cols-4 gap-6">
      <aside className="col-span-1 space-y-4">
        <TreasureSupplyPanel {...treasureSupplyProps} />
      </aside>

      <main className={cn("col-span-2 space-y-6", phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed')}>
        <TradingPost layout="desktop" onModeChange={setIsExchangeMode} onInvalidAction={triggerInvalidAction} />
        <AnimatePresence>
          {(!isExchangeMode || forceShowHold) && humanPlayer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ShipsHold player={humanPlayer} isCurrentPlayer={currentPlayerIndex === localPlayerIndex} layout="desktop" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <aside className="col-span-1 space-y-4">
        {opponentPlayer && (
          <ShipsHold
            player={opponentPlayer}
            isCurrentPlayer={currentPlayerIndex === opponentIndex}
            isOpponent
            isRaidMode={isRaidMode && currentPlayerIndex === localPlayerIndex}
            isPondering={isOpponentPondering}
            onRaidCard={handlePirateRaid}
            layout="desktop"
          />
        )}

        {optionalRules.pirateRaid && currentPlayerIndex === localPlayerIndex && phase === 'playing' && (
          <div className="p-4 rounded-xl bg-card border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair className="w-5 h-5 text-red-400" />
              <h3 className="font-pirate text-lg text-red-400">Pirate Raid</h3>
            </div>
            {humanPlayer.hasUsedPirateRaid ? (
              <p className="text-xs text-muted-foreground">Already used this game</p>
            ) : canRaid ? (
              <>
                <p className="text-xs text-muted-foreground mb-2">Steal one card from your opponent!</p>
                <Button
                  size="sm"
                  variant={isRaidMode ? 'destructive' : 'outline'}
                  className={cn('w-full', !isRaidMode && 'border-red-500/30 text-red-400 hover:bg-red-500/10')}
                  onClick={() => setIsRaidMode(!isRaidMode)}
                >
                  {isRaidMode ? <><X className="w-4 h-4 mr-1" />Cancel Raid</> : <><Crosshair className="w-4 h-4 mr-1" />Activate Raid</>}
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Cannot raid (hand full or no targets)</p>
            )}
          </div>
        )}

        <ScoreBoard />
        <AdSidebar />
      </aside>
    </div>
  </div>
  );
};
