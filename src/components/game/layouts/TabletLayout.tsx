import { motion, AnimatePresence } from 'framer-motion';
import { TradingPost } from '../TradingPost';
import { ShipsHold } from '../ShipsHold';
import { ScoreBoard } from '../ScoreBoard';
import { TreasureSupplyPanel } from './TreasureSupplyPanel';
import { cn } from '@/lib/utils';
import { LayoutProps } from './types';
import { useTutorialStore, TUTORIAL_STEPS } from '@/store/tutorialStore';

export const TabletLayout = ({
  treasureSupplyProps, isRaidMode, setIsRaidMode,
  isExchangeMode, setIsExchangeMode, triggerInvalidAction,
  humanPlayer, opponentPlayer, currentPlayerIndex, localPlayerIndex, opponentIndex,
  phase, isOpponentPondering, handlePirateRaid,
}: LayoutProps) => {
  const tutorialActive = useTutorialStore((s) => s.isActive);
  const tutorialStep = useTutorialStore((s) => s.currentStep);
  const forceShowHold = tutorialActive && TUTORIAL_STEPS[tutorialStep]?.highlightId === 'tutorial-ships-hold';

  return (
  <div className="hidden md:block lg:hidden">
    <div className="grid grid-cols-3 gap-4">
      <aside className="col-span-1 space-y-4">
        {opponentPlayer && (
          <ShipsHold
            player={opponentPlayer}
            isCurrentPlayer={currentPlayerIndex === opponentIndex}
            isOpponent
            isRaidMode={isRaidMode && currentPlayerIndex === localPlayerIndex}
            onRaidCard={handlePirateRaid}
            layout="tablet"
            isPondering={isOpponentPondering}
          />
        )}
        <ScoreBoard />
      </aside>

      <main className={cn("col-span-1 space-y-4", phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed')}>
        <TradingPost layout="tablet" onModeChange={setIsExchangeMode} onInvalidAction={triggerInvalidAction} />
        <AnimatePresence>
          {(!isExchangeMode || forceShowHold) && humanPlayer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ShipsHold player={humanPlayer} isCurrentPlayer={currentPlayerIndex === localPlayerIndex} layout="tablet" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <aside className="col-span-1 space-y-4">
        <TreasureSupplyPanel {...treasureSupplyProps} isRaidMode={isRaidMode} setIsRaidMode={setIsRaidMode} />
      </aside>
    </div>
  </div>
);
