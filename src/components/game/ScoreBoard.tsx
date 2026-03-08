import { motion } from 'framer-motion';
import { useGameStore, calculateScore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Trophy, Anchor, Medal, Coins, Scroll } from 'lucide-react';

export const ScoreBoard = () => {
  const { players, round, maxRounds, roundWins } = useGameStore();

  return (
    <div className="p-4 rounded-xl bg-card border border-primary/20 parchment-texture">
      {/* Captain's Ledger header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Scroll className="w-5 h-5 text-primary" />
        <h2 className="font-pirate text-xl text-primary">Captain's Ledger</h2>
      </div>

      {/* Voyage indicator (rounds) */}
      <div className="text-center mb-4">
        <span className="text-sm text-muted-foreground">Voyage</span>
        <div className="flex items-center justify-center gap-1 mt-1">
          {Array.from({ length: maxRounds }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                'transition-all duration-300',
                i + 1 === round
                  ? 'border-primary bg-primary/20 text-primary font-bold'
                  : i + 1 < round
                  ? 'border-primary/50 bg-primary/10 text-primary/50'
                  : 'border-border text-muted-foreground'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Player manifests */}
      <div className="space-y-3">
        {players.map((player, index) => {
          const score = calculateScore(player);
          
          return (
            <motion.div
              key={player.id}
              className={cn(
                'p-3 rounded-lg border overflow-visible',
                player.isAI ? 'bg-muted/50 border-border' : 'bg-primary/5 border-primary/20'
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-bold',
                    player.isAI ? 'text-foreground' : 'text-primary'
                  )}>
                    {player.name}
                  </span>
                  {player.isAI && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded">
                      AI
                    </span>
                  )}
                </div>
                {/* Voyage wins as wax seals */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: roundWins[index] || 0 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 rounded-full bg-destructive/80 border border-destructive flex items-center justify-center"
                      title="Voyage Won"
                    >
                      <Trophy className="w-3 h-3 text-destructive-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-2 text-sm overflow-visible">
                <div className="flex items-center gap-1.5 overflow-visible" title="Doubloons">
                  <img src="/images/doubloons.png" alt="Doubloons" className="w-8 h-8 object-contain -my-2" />
                  <span className="font-bold text-primary">{player.tokens.reduce((s, t) => s + t.value, 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-visible" title="Commissions">
                  <img src="/images/commissions.png" alt="Commissions" className="w-8 h-8 object-contain -my-2" />
                  <span className="font-bold text-primary">{player.bonusTokens.reduce((s, t) => s + t.value, 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-visible" title="Fleet">
                  <img src="/images/fleet.png" alt="Fleet" className="w-8 h-8 object-contain -my-2" />
                  <span className="font-bold text-primary">{player.ships.length}</span>
                </div>
              </div>

              {/* Total score */}
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <img src="/images/doubloons.png" alt="Doubloons" className="w-6 h-6 object-contain -my-1" />
                    Total
                  </span>
                  <span className={cn(
                    'font-bold text-lg font-pirate',
                    player.isAI ? 'text-foreground' : 'text-primary'
                  )}>
                    {score}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
