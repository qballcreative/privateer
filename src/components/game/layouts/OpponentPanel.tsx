import { memo } from 'react';
import { ShipsHold } from '../ShipsHold';
import { ScoreBoard } from '../ScoreBoard';
import { OpponentPanelProps } from './types';

export const OpponentPanel = memo(({ opponentPlayer, currentPlayerIndex, isRaidMode, onRaidCard, isPondering }: OpponentPanelProps) => (
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
    <ScoreBoard />
  </div>
));
OpponentPanel.displayName = 'OpponentPanel';
