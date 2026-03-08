import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Home, RotateCcw, Anchor, Crown, Ship, Coins } from 'lucide-react';
import { Player } from '@/types/game';
import { calculateScore, useGameStore } from '@/store/gameStore';
import { getScoreBreakdown } from '@/lib/scoring';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VictoryScreenProps {
  players: Player[];
  roundWins: number[];
  winner: Player | null;
  maxRounds: number;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}


/** Gold particle for confetti effect */
const GoldParticle = ({ index, total }: { index: number; total: number }) => {
  const angle = (index / total) * 360;
  const radius = 80 + Math.random() * 120;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;
  const size = 4 + Math.random() * 6;
  const delay = 0.3 + Math.random() * 0.8;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        background: `hsl(${38 + Math.random() * 10}, ${70 + Math.random() * 20}%, ${50 + Math.random() * 20}%)`,
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x: [0, x * 0.5, x],
        y: [0, y * 0.3 - 40, y + 100],
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0.3],
      }}
      transition={{ duration: 2 + Math.random(), delay, ease: 'easeOut' }}
    />
  );
};

const VoyageIndicator = ({ roundIndex, winnerIndex, players }: { roundIndex: number; winnerIndex: number; players: Player[] }) => {
  const winner = winnerIndex >= 0 ? players[winnerIndex] : null;
  const isPlayerWin = winner && !winner.isAI;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + roundIndex * 0.15 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border',
        isPlayerWin
          ? 'bg-primary/10 border-primary/30'
          : winner
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-muted/30 border-border'
      )}
    >
      <span className="text-xs text-muted-foreground w-16">Voyage {roundIndex + 1}</span>
      {winner ? (
        <>
          <Crown className={cn('w-3.5 h-3.5', isPlayerWin ? 'text-primary' : 'text-destructive')} />
          <span className={cn('text-sm font-medium', isPlayerWin ? 'text-primary' : 'text-destructive')}>
            {winner.name}
          </span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Draw</span>
      )}
    </motion.div>
  );
};

export const VictoryScreen = memo(({ players, roundWins, winner, maxRounds, onPlayAgain, onReturnHome }: VictoryScreenProps) => {
  const isPlayerVictory = winner && !winner.isAI;
  const particles = useMemo(() => Array.from({ length: 25 }, (_, i) => i), []);

  const roundWinners = useGameStore.getState().roundWinners || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-card p-6 sm:p-8 rounded-2xl border border-primary/30 shadow-2xl max-w-lg w-full text-center relative overflow-hidden"
        >
          {/* Confetti particles — victory only */}
          {isPlayerVictory && (
            <div className="absolute inset-0 pointer-events-none">
              {particles.map((i) => (
                <GoldParticle key={i} index={i} total={particles.length} />
              ))}
            </div>
          )}

          {/* Trophy animation */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.15 }}
            className="relative z-10"
          >
            <Trophy className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3',
              isPlayerVictory ? 'text-primary' : 'text-muted-foreground'
            )} />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10"
          >
            <h2 className="font-pirate text-2xl sm:text-3xl text-primary mb-1">
              {isPlayerVictory ? 'Admiral Appointed!' : 'Defeated!'}
            </h2>
            {isPlayerVictory && (
              <p className="text-sm text-muted-foreground mb-4">Letters of Marque Awarded</p>
            )}
            <p className="text-lg mb-5">
              <span className="text-primary font-bold">{winner?.name}</span>{' '}
              {isPlayerVictory ? 'has been named Admiral!' : 'claims victory!'}
            </p>
          </motion.div>

          {/* Voyage scoreboard */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 mb-5"
          >
            <h3 className="font-pirate text-sm text-muted-foreground mb-2 uppercase tracking-wider">Voyage Results</h3>
            {/* Per-round voyage indicators */}
            {roundWinners.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {roundWinners.map((winnerId, idx) => {
                  const winnerIdx = winnerId ? players.findIndex(p => p.id === winnerId) : -1;
                  return <VoyageIndicator key={idx} roundIndex={idx} winnerIndex={winnerIdx} players={players} />;
                })}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mb-3">
              {players.map((player, i) => (
                <div key={player.id} className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', !player.isAI ? 'text-primary' : 'text-muted-foreground')}>
                    {player.name}
                  </span>
                  <span className={cn(
                    'text-xl font-pirate',
                    !player.isAI ? 'text-primary' : 'text-foreground'
                  )}>
                    {roundWins[i]}
                  </span>
                  {i === 0 && <span className="text-muted-foreground mx-1">—</span>}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Score breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="relative z-10 grid grid-cols-2 gap-3 mb-6"
          >
            {players.map((player) => {
              const breakdown = getScoreBreakdown(player, players);
              return (
                <div
                  key={player.id}
                  className={cn(
                    'p-3 rounded-xl border text-left',
                    winner?.id === player.id
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/30 border-border'
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    {winner?.id === player.id && <Crown className="w-3.5 h-3.5 text-primary" />}
                    <span className="text-sm font-bold text-foreground truncate">{player.name}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> Doubloons</span>
                      <span>{breakdown.tokenScore}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Commissions</span>
                      <span>{breakdown.bonusScore}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1"><Anchor className="w-3 h-3" /> Fleet ({player.ships.length})</span>
                      <span>{breakdown.shipBonus > 0 ? `+${breakdown.shipBonus}` : '—'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1">
                      <span>Total</span>
                      <span className="text-primary font-pirate text-base">{breakdown.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative z-10 flex gap-3"
          >
            <Button onClick={onPlayAgain} variant="gold" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button onClick={onReturnHome} variant="outline" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Return to Port
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
VictoryScreen.displayName = 'VictoryScreen';
