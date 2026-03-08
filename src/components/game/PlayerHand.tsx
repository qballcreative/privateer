import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Card } from '@/types/game';
import { GameCard } from './GameCard';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Anchor, ShoppingCart, Crosshair } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  isOpponent?: boolean;
  isRaidMode?: boolean;
  onRaidCard?: (card: Card) => void;
}

export const PlayerHand = ({ 
  player, 
  isCurrentPlayer, 
  isOpponent = false,
  isRaidMode = false,
  onRaidCard,
}: PlayerHandProps) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const { sellCards, canSellCards, phase } = useGameStore();

  const toggleCard = (cardId: string) => {
    if (!isCurrentPlayer || isOpponent) return;
    
    setSelectedCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const handleCardClick = (card: Card) => {
    if (isRaidMode && isOpponent && onRaidCard) {
      onRaidCard(card);
    } else {
      toggleCard(card.id);
    }
  };

  const handleSell = () => {
    if (canSellCards(selectedCards)) {
      sellCards(selectedCards);
      setSelectedCards([]);
    }
  };

  // Group cards by type for better display
  const cardsByType = player.hand.reduce((acc, card) => {
    if (!acc[card.type]) acc[card.type] = [];
    acc[card.type].push(card);
    return acc;
  }, {} as Record<string, typeof player.hand>);

  const canSell = selectedCards.length > 0 && canSellCards(selectedCards);

  // Check if selected cards are same type
  const selectedType = selectedCards.length > 0
    ? player.hand.find((c) => c.id === selectedCards[0])?.type
    : null;
  const allSameType = selectedCards.every(
    (id) => player.hand.find((c) => c.id === id)?.type === selectedType
  );

  return (
    <div className={cn(
      'rounded-xl p-4 border transition-all duration-200',
      isCurrentPlayer && !isOpponent
        ? 'bg-card border-primary/30 shadow-lg'
        : 'bg-card/50 border-border',
      isRaidMode && isOpponent && 'ring-2 ring-red-500/50 border-red-500/30 bg-red-500/5'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-pirate text-lg text-primary">{player.name}</h3>
          {isCurrentPlayer && !isOpponent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              Your Turn
            </span>
          )}
          {isRaidMode && isOpponent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
              <Crosshair className="w-3 h-3" />
              Select a card to steal!
            </span>
          )}
        </div>
        
        {/* Ships count */}
        <div className="flex items-center gap-1 text-accent">
          <Anchor className="w-4 h-4" />
          <span className="text-sm font-bold">{player.ships.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap gap-2 min-h-[120px] items-center justify-center">
        <AnimatePresence mode="popLayout">
          {player.hand.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={cn(isRaidMode && isOpponent && 'cursor-crosshair')}
            >
              <GameCard
                card={card}
                selected={selectedCards.includes(card.id)}
                onClick={() => handleCardClick(card)}
                disabled={isRaidMode && isOpponent ? false : (!isCurrentPlayer || isOpponent || phase !== 'playing')}
                faceDown={isOpponent && !isRaidMode}
                size="md"
                className={cn(isRaidMode && isOpponent && 'hover:ring-2 hover:ring-red-500 hover:scale-105 transition-all')}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {player.hand.length === 0 && (
          <div className="text-muted-foreground text-sm">No cards in hand</div>
        )}
      </div>

      {/* Action buttons */}
      {isCurrentPlayer && !isOpponent && phase === 'playing' && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleSell}
            disabled={!canSell}
            className="game-button"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Sell {selectedCards.length > 0 ? `(${selectedCards.length})` : ''}
          </Button>
          
          {selectedCards.length > 0 && !allSameType && (
            <span className="text-xs text-destructive">Select same type</span>
          )}
          
          {selectedCards.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCards([])}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </motion.div>
      )}

      {/* Score summary */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Tokens: {player.tokens.reduce((sum, t) => sum + t.value, 0)} pts
        </span>
        <span className="text-muted-foreground">
          Bonus: {player.bonusTokens.reduce((sum, t) => sum + t.value, 0)} pts
        </span>
      </div>
    </div>
  );
};
