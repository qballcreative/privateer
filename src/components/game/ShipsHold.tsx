import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Card, HAND_LIMIT } from '@/types/game';
import { CargoObject } from './CargoObject';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Anchor, Package, Crosshair } from 'lucide-react';

interface ShipsHoldProps {
  player: Player;
  isCurrentPlayer: boolean;
  isOpponent?: boolean;
  isRaidMode?: boolean;
  onRaidCard?: (card: Card) => void;
}

export const ShipsHold = ({ 
  player, 
  isCurrentPlayer, 
  isOpponent = false,
  isRaidMode = false,
  onRaidCard,
}: ShipsHoldProps) => {
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

  const handleUnload = () => {
    if (canSellCards(selectedCards)) {
      sellCards(selectedCards);
      setSelectedCards([]);
    }
  };

  const canUnload = selectedCards.length > 0 && canSellCards(selectedCards);

  // Check if selected cards are same type
  const selectedType = selectedCards.length > 0
    ? player.hand.find((c) => c.id === selectedCards[0])?.type
    : null;
  const allSameType = selectedCards.every(
    (id) => player.hand.find((c) => c.id === id)?.type === selectedType
  );

  // Calculate empty slots for visual display
  const emptySlots = Math.max(0, HAND_LIMIT - player.hand.length);

  return (
    <div className={cn(
      'rounded-xl p-4 border-2 transition-all duration-200',
      isCurrentPlayer && !isOpponent
        ? 'bg-card border-primary/40 shadow-lg'
        : 'bg-card/50 border-border',
      isRaidMode && isOpponent && 'ring-2 ring-destructive/50 border-destructive/30 bg-destructive/5'
    )}>
      {/* Header - Ship's Hold label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-pirate text-lg text-primary">
            {isOpponent ? `${player.name}'s Hold` : "Captain's Hold"}
          </h3>
          {isCurrentPlayer && !isOpponent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              Your Turn
            </span>
          )}
          {isRaidMode && isOpponent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
              <Crosshair className="w-3 h-3" />
              Select cargo to raid!
            </span>
          )}
        </div>
        
        {/* Fleet count */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20">
          <Anchor className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-accent">Fleet: {player.ships.length}</span>
        </div>
      </div>

      {/* Cargo Hold - Slot-based visualization */}
      <div className="relative p-3 rounded-lg bg-muted/30 border border-border min-h-[120px]">
        {/* Cargo slots */}
        <div className="flex flex-wrap gap-2 items-center justify-center">
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
                <CargoObject
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  onClick={() => handleCardClick(card)}
                  disabled={isRaidMode && isOpponent ? false : (!isCurrentPlayer || isOpponent || phase !== 'playing')}
                  hidden={isOpponent && !isRaidMode}
                  size="md"
                  className={cn(isRaidMode && isOpponent && 'hover:ring-2 hover:ring-destructive hover:scale-105 transition-all')}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty cargo slots */}
          {!isOpponent && Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-20 h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center"
            >
              <Package className="w-6 h-6 text-muted-foreground/20" />
            </div>
          ))}

          {player.hand.length === 0 && isOpponent && (
            <div className="text-muted-foreground text-sm italic">Hold is empty</div>
          )}
        </div>
      </div>

      {/* Action buttons - Unload Cargo */}
      {isCurrentPlayer && !isOpponent && phase === 'playing' && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleUnload}
            disabled={!canUnload}
            className="game-button"
            size="sm"
          >
            <Package className="w-4 h-4 mr-1" />
            Unload Cargo {selectedCards.length > 0 ? `(${selectedCards.length})` : ''}
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

      {/* Score summary - Doubloons and Commissions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Doubloons: <span className="font-bold text-primary">{player.tokens.reduce((sum, t) => sum + t.value, 0)}</span>
        </span>
        <span className="text-muted-foreground">
          Commissions: <span className="font-bold text-primary">{player.bonusTokens.reduce((sum, t) => sum + t.value, 0)}</span>
        </span>
      </div>
    </div>
  );
};
