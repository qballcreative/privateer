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
  layout?: 'phone' | 'tablet' | 'desktop';
}

export const ShipsHold = ({ 
  player, 
  isCurrentPlayer, 
  isOpponent = false,
  isRaidMode = false,
  onRaidCard,
  layout = 'desktop',
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

  const selectedType = selectedCards.length > 0
    ? player.hand.find((c) => c.id === selectedCards[0])?.type
    : null;
  const allSameType = selectedCards.every(
    (id) => player.hand.find((c) => c.id === id)?.type === selectedType
  );

  const emptySlots = Math.max(0, HAND_LIMIT - player.hand.length);
  const isPhone = layout === 'phone';
  const cargoSize = isPhone ? 'sm' : layout === 'tablet' ? 'md' : 'md';

  return (
    <div className={cn(
      'rounded-xl border-2 transition-all duration-200',
      isPhone ? 'p-3' : 'p-4',
      isCurrentPlayer && !isOpponent
        ? 'bg-card border-primary/40 shadow-lg'
        : 'bg-card/50 border-border',
      isRaidMode && isOpponent && 'ring-2 ring-destructive/50 border-destructive/30 bg-destructive/5'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h3 className={cn(
            "font-pirate text-primary",
            isPhone ? "text-base" : "text-lg"
          )}>
            {isOpponent ? `${player.name}'s Hold` : "Captain's Hold"}
          </h3>
          {isCurrentPlayer && !isOpponent && (
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              Your Turn
            </span>
          )}
          {isRaidMode && isOpponent && (
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
              <Crosshair className="w-3 h-3" />
              Raid!
            </span>
          )}
        </div>
        
        {/* Fleet count */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-accent/10 border border-accent/20">
          <Anchor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
          <span className="text-xs sm:text-sm font-bold text-accent">{player.ships.length}</span>
        </div>
      </div>

      {/* Cargo Hold — horizontal scroll on phone */}
      <div className={cn(
        "relative rounded-lg bg-muted/30 border border-border",
        isPhone ? "p-2 min-h-[80px]" : "p-3 min-h-[120px]"
      )}>
        <div className={cn(
          isPhone
            ? "flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            : "flex flex-wrap gap-2 items-center justify-center"
        )}>
          <AnimatePresence mode="popLayout">
            {player.hand.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  isRaidMode && isOpponent && 'cursor-crosshair',
                  isPhone && 'flex-shrink-0'
                )}
              >
                <CargoObject
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  onClick={() => handleCardClick(card)}
                  disabled={isRaidMode && isOpponent ? false : (!isCurrentPlayer || isOpponent || phase !== 'playing')}
                  hidden={isOpponent && !isRaidMode}
                  size={cargoSize}
                  className={cn(isRaidMode && isOpponent && 'hover:ring-2 hover:ring-destructive hover:scale-105 transition-all')}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty cargo slots */}
          {!isOpponent && Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className={cn(
                "rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center",
                isPhone ? "w-14 h-16 flex-shrink-0" : "w-20 h-24"
              )}
            >
              <Package className={cn(
                "text-muted-foreground/20",
                isPhone ? "w-4 h-4" : "w-6 h-6"
              )} />
            </div>
          ))}

          {player.hand.length === 0 && isOpponent && (
            <div className="text-muted-foreground text-xs sm:text-sm italic">Hold is empty</div>
          )}
        </div>
      </div>

      {/* Unload Cargo — near bottom on phone */}
      {isCurrentPlayer && !isOpponent && phase === 'playing' && (
        <motion.div
          className="mt-3 sm:mt-4 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleUnload}
            disabled={!canUnload}
            className="game-button text-xs sm:text-sm"
            size="sm"
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Unload {selectedCards.length > 0 ? `(${selectedCards.length})` : ''}
          </Button>
          
          {selectedCards.length > 0 && !allSameType && (
            <span className="text-[10px] sm:text-xs text-destructive">Same type only</span>
          )}
          
          {selectedCards.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCards([])}
              className="text-muted-foreground text-xs"
            >
              Clear
            </Button>
          )}
        </motion.div>
      )}

      {/* Score summary */}
      <div className={cn(
        "mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border flex items-center justify-between",
        isPhone ? "text-xs" : "text-sm"
      )}>
        <span className="text-muted-foreground">
          Doubloons: <span className="font-bold text-primary">{player.tokens.reduce((sum, t) => sum + t.value, 0)}</span>
        </span>
        <span className="text-muted-foreground">
          Comm: <span className="font-bold text-primary">{player.bonusTokens.reduce((sum, t) => sum + t.value, 0)}</span>
        </span>
      </div>
    </div>
  );
};
