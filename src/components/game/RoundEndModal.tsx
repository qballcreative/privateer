import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Gift, RotateCcw } from 'lucide-react';
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
              <Anchor className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-4" />
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

              {/* Score breakdown per player */}
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
