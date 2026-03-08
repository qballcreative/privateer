import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Card, HAND_LIMIT } from '@/types/game';
import CargoObject from './CargoObject';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Anchor, ArrowLeftRight, AlertTriangle, Ship } from 'lucide-react';

interface TradingPostProps {
  layout?: 'phone' | 'tablet' | 'desktop';
  onModeChange?: (isExchange: boolean) => void;
}

// Rise-from-dock animation for new cards arriving from deck
const riseFromDock = {
  initial: { opacity: 0, y: 50, scale: 0.7 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.85 },
};

// Ship fan-out exit animation
const shipFanExit = (index: number, total: number) => ({
  opacity: 0,
  y: 60,
  x: (index - (total - 1) / 2) * 30,
  scale: 0.6,
  rotate: (index - (total - 1) / 2) * 8,
});

export const TradingPost = ({ layout = 'desktop', onModeChange }: TradingPostProps) => {
  const { 
    market, 
    takeCard, 
    takeAllShips, 
    exchangeCards,
    canTakeCard, 
    getCurrentPlayer,
    phase,
    deck,
    lastAction,
  } = useGameStore();
  
  const [selectedMarketCards, setSelectedMarketCards] = useState<string[]>([]);
  const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);
  const [mode, setMode] = useState<'take' | 'exchange'>('take');

  const currentPlayer = getCurrentPlayer();
  const isPlayerTurn = !currentPlayer.isAI;
  const ships = market.filter((c) => c.type === 'ships');
  const nonShips = market.filter((c) => c.type !== 'ships');

  const handleCardClick = (cardId: string) => {
    if (!isPlayerTurn || phase !== 'playing') return;
    const card = market.find(c => c.id === cardId);
    
    if (mode === 'take') {
      if (card?.type === 'ships') return;
      if (canTakeCard(cardId)) {
        takeCard(cardId);
      }
    } else {
      setSelectedMarketCards((prev) =>
        prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
      );
    }
  };

  const handleCommandeerFleet = () => {
    if (ships.length > 0 && isPlayerTurn) {
      takeAllShips();
    }
  };

  const getExchangeHandSize = () => {
    const handCardsSelected = currentPlayer.hand.filter(c => selectedHandCards.includes(c.id)).length;
    const nonShipMarketCardsSelected = market
      .filter(c => selectedMarketCards.includes(c.id) && c.type !== 'ships').length;
    return currentPlayer.hand.length - handCardsSelected + nonShipMarketCardsSelected;
  };

  const wouldExceedHandLimit = getExchangeHandSize() > HAND_LIMIT;

  const handleExchange = () => {
    if (selectedMarketCards.length >= 2 && 
        selectedMarketCards.length === selectedHandCards.length &&
        !wouldExceedHandLimit) {
      exchangeCards(selectedHandCards, selectedMarketCards);
      setSelectedMarketCards([]);
      setSelectedHandCards([]);
      setMode('take');
      onModeChange?.(false);
    }
  };

  const toggleHandCard = (cardId: string) => {
    setSelectedHandCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const isPhone = layout === 'phone';
  const cargoSize = isPhone ? 'sm' : layout === 'tablet' ? 'md' : 'lg';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mode Toggle */}
      {isPlayerTurn && phase === 'playing' && (
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
          <Button
            variant={mode === 'take' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('take');
              setSelectedMarketCards([]);
              setSelectedHandCards([]);
              onModeChange?.(false);
            }}
            className={cn(mode === 'take' && 'game-button', 'text-xs sm:text-sm px-3 sm:px-4')}
          >
            <img src="/Icons/Claim.png" alt="Claim" className="w-5 h-5 sm:w-6 sm:h-6 mr-1 object-contain" />
            Claim Cargo
          </Button>
          <Button
            variant={mode === 'exchange' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setMode('exchange'); onModeChange?.(true); }}
            className={cn(mode === 'exchange' && 'ocean-button', 'text-xs sm:text-sm px-3 sm:px-4')}
          >
            <img src="/Icons/Trade.png" alt="Trade" className="w-5 h-5 sm:w-6 sm:h-6 mr-1 object-contain" />
            Trade Goods
          </Button>
        </div>
      )}

      {/* Trading Post — Dock Table Surface */}
      <div className={cn(
        "relative rounded-xl trading-post-surface overflow-visible mt-4",
        isPhone ? "p-3" : "p-6"
      )}
        style={{
          backgroundImage: `url('/images/trading-post-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Subdued overlay to keep cargo readable */}
        <div className="absolute inset-0 rounded-xl bg-card/80 pointer-events-none" />
        {/* Trading Post Label */}
        {!isPhone && (
          <div className="absolute -top-3 left-4 z-10">
            <span className="font-pirate text-primary text-sm px-3 py-1 bg-card rounded-full border border-primary/30 shadow-md">
              Trading Post
            </span>
          </div>
        )}

        {/* Supply Ship indicator */}
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-2 sm:px-3 py-1 bg-card rounded-full border border-border shadow-md z-10",
          isPhone ? "mb-2 w-fit mx-auto" : "absolute -top-3 right-4"
        )}>
          <img src="/images/supply.png" alt="Supply" className="w-5 h-5 sm:w-6 sm:h-6 object-contain -my-1" />
          <span className="text-muted-foreground">Supply:</span>
          <span className="font-bold text-foreground">{deck.length}</span>
        </div>

        {/* Cargo on the dock */}
        <div className={cn(
          "relative z-[1]",
          "min-h-[80px] sm:min-h-[140px]",
          isPhone 
            ? "flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1" 
            : "flex flex-wrap items-end justify-center gap-4 sm:gap-6 pt-4"
        )}>
          <LayoutGroup id="trading-post">
            <AnimatePresence mode="sync">
              {market.map((card, index) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={riseFromDock.initial}
                  animate={riseFromDock.animate}
                  exit={
                    lastAction?.type === 'take-ships' && card.type === 'ships'
                      ? shipFanExit(index, ships.length)
                      : lastAction?.type === 'exchange'
                        ? { opacity: 0, x: 80, scale: 0.8 }
                        : { opacity: 0, y: 40, scale: 0.85 }
                  }
                  transition={{
                    layout: { type: 'spring', stiffness: 300, damping: 25 },
                    delay: index * 0.06,
                    type: 'spring',
                    stiffness: 250,
                    damping: 22,
                  }}
                  className={cn(isPhone && "flex-shrink-0")}
                >
                  <CargoObject
                    card={card}
                    selected={selectedMarketCards.includes(card.id)}
                    onClick={() => handleCardClick(card.id)}
                    disabled={!isPlayerTurn || phase !== 'playing'}
                    size={cargoSize}
                    enableLayoutId
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </LayoutGroup>
          
          {market.length === 0 && (
            <div className="text-muted-foreground text-sm italic">
              No cargo at the trading post
            </div>
          )}
        </div>

        {/* Commandeer Fleet */}
        {ships.length > 0 && isPlayerTurn && phase === 'playing' && mode === 'take' && (
          <motion.div
            className="mt-3 sm:mt-4 flex justify-center relative z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={handleCommandeerFleet}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative group flex flex-col items-center cursor-pointer focus:outline-none"
            >
              {/* Fleet image — overflows above the pill */}
              <motion.img
                src="/images/fleet.png"
                alt="Fleet"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_4px_12px_hsl(var(--accent)/0.5)] group-hover:drop-shadow-[0_6px_20px_hsl(var(--accent)/0.7)] transition-all duration-300 -mb-3"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Text pill */}
              <span className="px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-pirate text-xs sm:text-sm backdrop-blur-sm group-hover:bg-accent/30 group-hover:border-accent/60 transition-all duration-300 shadow-[0_0_15px_hsl(var(--accent)/0.2)] group-hover:shadow-[0_0_25px_hsl(var(--accent)/0.4)]">
                Commandeer Fleet ({ships.length})
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Exchange Mode — Hold Selection */}
      {mode === 'exchange' && isPlayerTurn && phase === 'playing' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3 sm:p-4 rounded-lg bg-accent/10 border border-accent/20"
        >
          <p className="text-xs sm:text-sm text-accent mb-3">
            Select cargo from your hold to trade ({selectedHandCards.length}/{selectedMarketCards.length})
          </p>
          
          {wouldExceedHandLimit && selectedMarketCards.length > 0 && (
            <div className="flex items-center gap-2 text-destructive text-xs sm:text-sm mb-3 p-2 bg-destructive/10 rounded">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Trade would exceed hold limit of {HAND_LIMIT}.</span>
            </div>
          )}
          
          {/* Exchange swap lane visualization */}
          <div className="relative">
            {selectedMarketCards.length > 0 && selectedHandCards.length > 0 && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="flex items-center gap-2 text-accent"
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </motion.div>
              </motion.div>
            )}

            {/* Cargo row */}
            {currentPlayer.hand.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">Cargo</p>
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                  <AnimatePresence mode="popLayout">
                    {currentPlayer.hand.map((card) => (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={cn(isPhone && "flex-shrink-0")}
                      >
                        <CargoObject
                          card={card}
                          selected={selectedHandCards.includes(card.id)}
                          onClick={() => toggleHandCard(card.id)}
                          size="sm"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Ships row */}
            {currentPlayer.ships.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">
                  Fleet
                </p>
                <div className={cn(
                  isPhone
                    ? "flex gap-2 overflow-x-auto scrollbar-hide pb-2"
                    : "flex flex-wrap gap-3 justify-center"
                )}>
                  <AnimatePresence mode="popLayout">
                    {currentPlayer.ships.map((card) => (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={cn(isPhone && "flex-shrink-0")}
                      >
                        <CargoObject
                          card={card}
                          selected={selectedHandCards.includes(card.id)}
                          onClick={() => toggleHandCard(card.id)}
                          size="sm"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 sm:mt-4 flex justify-center gap-2">
            <Button
              onClick={handleExchange}
              disabled={selectedMarketCards.length < 2 || 
                       selectedHandCards.length !== selectedMarketCards.length ||
                       wouldExceedHandLimit}
              className="ocean-button text-xs sm:text-sm"
              size="sm"
            >
              Complete Trade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
              setSelectedMarketCards([]);
              setSelectedHandCards([]);
              setMode('take');
              onModeChange?.(false);
            }}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
