/** OpponentPanel — Opponent's hold + scoreboard + pirate raid toggle (used in phone/tablet drawers). */
import { memo } from 'react';
import { ShipsHold } from '../ShipsHold';
import { ScoreBoard } from '../ScoreBoard';
import { Button } from '@/components/ui/button';
import { Crosshair, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpponentPanelProps } from './types';

export const OpponentPanel = memo(({
  opponentPlayer, currentPlayerIndex, isRaidMode, onRaidCard, isPondering,
  optionalRules, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid, setIsRaidMode,
}: OpponentPanelProps) => (
  <div className="space-y-4">
    {opponentPlayer && (
      <ShipsHold
        player={opponentPlayer}
        isCurrentPlayer={currentPlayerIndex === 1}
        isOpponent
        isRaidMode={isRaidMode && currentPlayerIndex === 0}
        onRaidCard={onRaidCard}
        isPondering={isPondering}
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
        ) : canUsePirateRaid() && !currentPlayer.isAI ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Steal one cargo from your opponent!
            </p>
            {isRaidMode ? (
              <p className="text-xs text-red-400 font-medium animate-pulse">
                Select a card from your opponent's hold to steal!
              </p>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => setIsRaidMode(true)}
              >
                <Crosshair className="w-4 h-4 mr-1" />
                Activate Raid
              </Button>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {currentPlayer.isAI ? 'Wait for your turn' : 'Cannot raid (hand full or no targets)'}
          </p>
        )}
      </div>
    )}

    <ScoreBoard />
  </div>
));
OpponentPanel.displayName = 'OpponentPanel';
