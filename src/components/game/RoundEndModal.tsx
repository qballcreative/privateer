/**
 * RoundEndModal — Between-Round Results Screen
 *
 * Shown at the end of each round in a best-of series. Displays the round
 * winner, score breakdowns, revealed treasure chest tokens (if that rule
 * is active), and a "Next Round" button. In multiplayer, only the host
 * can advance to the next round.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, RotateCcw } from 'lucide-react';
import { Player, HiddenTreasure } from '@/types/game';
import { calculateScore, useGameStore } from '@/store/gameStore';
import { getScoreBreakdown } from '@/lib/scoring';
import { Button } from '@/components/ui/button';

interface RoundEndModalProps {
  phase: string;
  round: number;
  players: Player[];
  roundWinner: Player | null;
  optionalRules: { treasureChest?: boolean };
  hiddenTreasures: HiddenTreasure[];
  isMultiplayer: boolean;
  isHost: boolean;
  onNextRound: () => void;
}

/** Animated wax seal that stamps onto the modal */
const WaxSeal = ({ round, isWinner }: { round: number; isWinner: boolean }) => {
  // Choose seal based on round
  const sealSrc = round === 3 
    ? '/Icons/goldseal.webp' 
    : round === 2 
      ? '/Icons/silverseal.webp' 
      : '/Icons/redseal.webp';

  return (
    <motion.div
      className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4"
      initial={{ scale: 3, rotate: -45, opacity: 0, y: -100 }}
      animate={{ 
        scale: [3, 0.9, 1.05, 1], 
        rotate: [-45, 5, -3, 0], 
        opacity: 1, 
        y: 0 
      }}
      transition={{ 
        duration: 0.6, 
        times: [0, 0.6, 0.8, 1],
        ease: 'easeOut',
        delay: 0.2
      }}
    >
      {/* Shadow that appears on impact */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(0, 0%, 0% / 0.3) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.2 }}
      />
      
      {/* Main seal image */}
      <motion.img
        src={sealSrc}
        alt="Wax seal"
        className="w-full h-full object-contain relative z-10 drop-shadow-lg"
        initial={{ filter: 'brightness(1.5)' }}
        animate={{ filter: 'brightness(1)' }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />

      {/* Impact flash */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isWinner 
            ? 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 60%)'
            : 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.4) 0%, transparent 60%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 2.5], opacity: [0, 0.8, 0] }}
        transition={{ delay: 0.45, duration: 0.5 }}
      />

      {/* Ribbon beneath seal */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <div 
          className="w-3 h-8 rounded-b-sm origin-top"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
            transform: 'rotate(-15deg)',
          }}
        />
        <div 
          className="w-3 h-8 rounded-b-sm origin-top"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
            transform: 'rotate(15deg)',
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export const RoundEndModal = ({
  phase,
  round,
  players,
  roundWinner,
  optionalRules,
  hiddenTreasures,
  isMultiplayer,
  isHost,
  onNextRound,
}: RoundEndModalProps) => {
  const isPlayerWinner = roundWinner && !roundWinner.isAI;
  return (
    <AnimatePresence>
      {phase === 'roundEnd' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          {/* Decorative flourish lines */}
          <motion.div
            className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          />

          <motion.div
            initial={{ scale: 0.85, y: 30, rotateX: 5 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-card p-6 sm:p-8 rounded-2xl border border-primary/30 shadow-2xl max-w-md w-full"
          >
            <div className="text-center">
              {/* Animated wax seal stamp */}
              <WaxSeal round={round} isWinner={!!isPlayerWinner} />
              
              <h2 className="font-pirate text-2xl sm:text-3xl text-primary mb-2">
                Voyage {round} Complete!
              </h2>

              {roundWinner && (
                <p className="text-lg sm:text-xl mb-4">
                  <span className="text-primary font-bold">{roundWinner.name}</span>{' '}
                  wins this voyage!
                </p>
              )}

              {optionalRules.treasureChest && hiddenTreasures.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="font-pirate text-primary">Hidden Cargo Revealed!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {hiddenTreasures.map((treasure) => {
                      const player = players.find((p) => p.id === treasure.playerId);
                      return (
                        <div key={treasure.playerId} className="text-muted-foreground">
                          {player?.name}: +{treasure.tokens.reduce((sum, t) => sum + t.value, 0)} doubloons
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {players.map((player) => {
                  const breakdown = getScoreBreakdown(player, players);
                  return (
                    <div key={player.id} className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border text-left">
                      <p className="font-bold text-foreground text-sm sm:text-base mb-1">{player.name}</p>
                      <p className="text-2xl sm:text-3xl font-pirate text-primary">{breakdown.total}</p>
                      <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Doubloons</span>
                          <span>{breakdown.tokenScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commissions</span>
                          <span>{breakdown.bonusScore}</span>
                        </div>
                        {breakdown.shipBonus > 0 && (
                          <div className="flex justify-between text-primary">
                            <span>Fleet Bonus</span>
                            <span>+{breakdown.shipBonus}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={onNextRound}
                className="game-button w-full"
                disabled={isMultiplayer && !isHost}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {isMultiplayer && !isHost
                  ? 'Waiting for host...'
                  : round >= 3
                    ? 'See Final Results'
                    : `Begin Voyage ${round + 1}`}

              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
