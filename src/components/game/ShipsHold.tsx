import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Card, HAND_LIMIT } from '@/types/game';
import CargoObject from './CargoObject';
import { UnloadChest } from './UnloadChest';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Anchor, Package, Crosshair, Swords } from 'lucide-react';

interface ShipsHoldProps {
  player: Player;
  isCurrentPlayer: boolean;
  isOpponent?: boolean;
  isRaidMode?: boolean;
  onRaidCard?: (card: Card) => void;
  layout?: 'phone' | 'tablet' | 'desktop';
  isPondering?: boolean;
}

// Cargo slides into hold from above (arriving from Trading Post)
const slideIntoSlot = {
  initial: { opacity: 0, y: -40, scale: 0.8 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.85 },
};

// Ships fan into the hold with stagger
const shipFanIn = (index: number) => ({
  opacity: 0,
  y: -50,
  x: (index - 1) * -20,
  scale: 0.6,
  rotate: (index - 1) * -6,
});

export const ShipsHold = ({ 
  player, 
  isCurrentPlayer, 
  isOpponent = false,
  isRaidMode = false,
  onRaidCard,
  layout = 'desktop',
  isPondering = false,
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
    <div
      data-tutorial-id={!isOpponent ? 'tutorial-ships-hold' : undefined}
      className={cn(
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
            isPhone ? "text-sm" : "text-sm"
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
        
        {/* Fleet count - always shown */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-accent/10 border border-accent/20">
          <img src="/images/fleet.webpp" alt="Fleet" className="w-7 h-7 sm:w-8 sm:h-8 object-contain -ml-1 -my-2" />
          <span className="text-xs sm:text-sm font-bold text-accent">{player.ships.length}</span>
        </div>
      </div>

      {/* Cargo Hold */}
      <div className={cn(
        "relative rounded-lg border border-border overflow-hidden",
        isPhone ? "p-2 min-h-[80px]" : "p-3 min-h-[120px]"
      )}
        style={{
          backgroundImage: `url('/images/cargo-hold-bgwebpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Subdued overlay */}
        <div className="absolute inset-0 rounded-lg bg-black/50 pointer-events-none" />
        <div className={cn(
          "relative z-[1]",
          isPhone
            ? "flex gap-3 overflow-x-auto scrollbar-hide pb-1 items-end"
            : "flex flex-wrap gap-4 items-end justify-center"
        )}>
          <AnimatePresence mode="sync">
            {player.hand.map((card, index) => (
              <motion.div
                key={card.id}
                initial={slideIntoSlot.initial}
                animate={slideIntoSlot.animate}
                exit={slideIntoSlot.exit}
                transition={{
                  delay: index * 0.04,
                  type: 'spring',
                  stiffness: 280,
                  damping: 22,
                }}
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
                  enableLayoutId={!isOpponent}
                  className={cn(isRaidMode && isOpponent && 'hover:ring-2 hover:ring-destructive hover:scale-105 transition-all')}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty cargo slots */}
          {!isOpponent && Array.from({ length: emptySlots }).map((_, index) => (
            <motion.div
              key={`empty-${index}`}
              layout
              className={cn(
                "rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center",
                isPhone ? "w-12 h-12 flex-shrink-0" : "w-16 h-16"
              )}
              style={{
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <Package className={cn(
                "text-muted-foreground/15",
                isPhone ? "w-4 h-4" : "w-5 h-5"
              )} />
            </motion.div>
          ))}

          {player.hand.length === 0 && isOpponent && (
            <div className="text-muted-foreground text-xs sm:text-sm italic">Hold is empty</div>
          )}
        </div>

        {/* AI Pondering overlay */}
        <AnimatePresence>
          {isPondering && (
            <motion.div
              key="pondering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-black/50 backdrop-blur-[2px]"
            >
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Swords className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="font-pirate text-sm text-primary">Pondering…</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unload Chest + Score */}
      {isCurrentPlayer && !isOpponent && phase === 'playing' && (
        <UnloadChest
          selectedCards={selectedCards}
          player={player}
          onUnload={handleUnload}
          onClear={() => setSelectedCards([])}
          canUnload={canUnload}
          allSameType={allSameType}
          layout={layout}
        />
      )}

    </div>
  );
};
