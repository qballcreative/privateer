/**
 * ScoreBoard — Captain's Ledger (Desktop Sidebar)
 *
 * Displays both players' current scores with breakdown (doubloons,
 * commission seals, fleet bonus), round progress, and voyage win indicators.
 * Only visible on desktop layout — phone/tablet use drawer-based score displays.
 * Memoized to prevent re-renders from unrelated state changes.
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, calculateScore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Trophy, Anchor, Medal, Coins, Scroll } from 'lucide-react';

export const ScoreBoard = memo(() => {
  const { players, round, maxRounds, roundWins } = useGameStore();

  return (
    <div className="p-4 rounded-xl border border-primary/20 relative overflow-hidden" style={{ backgroundImage: 'url(/images/ledger-bg.webp)', backgroundSize: '100% 100%', opacity: 1 }}>
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="relative z-10">
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
          const score = calculateScore(player, players);
          const maxShips = Math.max(...players.map((p) => p.ships.length));
          const hasFleetBonus = player.ships.length > 0 && player.ships.length === maxShips && players.filter((p) => p.ships.length === maxShips).length === 1;
          
          return (
            <motion.div
              key={player.id}
              className={cn(
                'p-3 rounded-lg border overflow-visible',
                player.isAI ? 'bg-black/40 border-white/10' : 'bg-black/30 border-primary/30'
              )}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-bold drop-shadow-md',
                    player.isAI ? 'text-foreground' : 'text-primary'
                  )}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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
              <div className="grid grid-cols-2 gap-2 text-sm overflow-visible">
                <div className="flex items-center gap-1.5 overflow-visible" title="Doubloons">
                  <img src="/images/doubloons.webp" alt="Doubloons" className="w-8 h-8 object-contain -my-2" />
                  <span className="font-bold text-primary" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{player.tokens.reduce((s, t) => s + t.value, 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-visible" title="Commissions">
                  <img src="/images/commissions.webp" alt="Commissions" className="w-8 h-8 object-contain -my-2" />
                  <span className="font-bold text-primary" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{player.bonusTokens.reduce((s, t) => s + t.value, 0)}</span>
                </div>
              </div>

              {/* Fleet bonus row */}
              <div className="flex items-center gap-1.5 mt-1 text-sm overflow-visible" title={`Fleet: ${player.ships.length} ships${hasFleetBonus ? ' — Largest Fleet +5' : ''}`}>
                <img src="/images/fleet.webp" alt="Fleet" className="w-8 h-8 object-contain -my-2" />
                <span className="text-foreground/80" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{player.ships.length}</span>
                {hasFleetBonus && (
                  <span className="text-xs font-bold text-primary ml-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>+5</span>
                )}
              </div>

              {/* Total score */}
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground/70 flex items-center gap-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    <img src="/images/doubloons.webp" alt="Doubloons" className="w-6 h-6 object-contain -my-1" />
                    Total
                  </span>
                  <span className={cn(
                    'font-bold text-lg font-pirate',
                    player.isAI ? 'text-foreground' : 'text-primary'
                  )}
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                    {score}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      </div>
    </div>
  );
});
ScoreBoard.displayName = 'ScoreBoard';
