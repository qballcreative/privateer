import { motion, AnimatePresence } from 'framer-motion';
import { TradingPost } from '../TradingPost';
import { ShipsHold } from '../ShipsHold';
import { ScoreBoard } from '../ScoreBoard';
import { TreasureSupplyPanel } from './TreasureSupplyPanel';
import { cn } from '@/lib/utils';
import { LayoutProps } from './types';

export const DesktopLayout = ({
  treasureSupplyProps, isRaidMode, setIsRaidMode,
  isExchangeMode, setIsExchangeMode, triggerInvalidAction,
  humanPlayer, opponentPlayer, currentPlayerIndex, localPlayerIndex, opponentIndex,
  phase, isOpponentPondering, handlePirateRaid,
}: LayoutProps) => (
  <div className="hidden lg:block">
    <div className="grid grid-cols-4 gap-6">
      <aside className="col-span-1 space-y-4">
        <TreasureSupplyPanel {...treasureSupplyProps} isRaidMode={isRaidMode} setIsRaidMode={setIsRaidMode} />
      </aside>

      <main className={cn("col-span-2 space-y-6", phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed')}>
        <TradingPost layout="desktop" onModeChange={setIsExchangeMode} onInvalidAction={triggerInvalidAction} />
        <AnimatePresence>
          {!isExchangeMode && humanPlayer && (
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
        <ScoreBoard />
      </aside>
    </div>
  </div>
);
