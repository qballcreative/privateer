import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, HAND_LIMIT } from '@/types/game';
import { CargoObject } from './CargoObject';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Anchor, ArrowLeftRight, Hand, AlertTriangle, Ship } from 'lucide-react';

interface TradingPostProps {
  layout?: 'phone' | 'tablet' | 'desktop';
}

export const TradingPost = ({ layout = 'desktop' }: TradingPostProps) => {
  const { 
    market, 
    takeCard, 
    takeAllShips, 
    exchangeCards,
    canTakeCard, 
    getCurrentPlayer,
    phase,
    deck,
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
            }}
            className={cn(mode === 'take' && 'game-button', 'text-xs sm:text-sm px-3 sm:px-4')}
          >
            <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Claim Cargo
          </Button>
          <Button
            variant={mode === 'exchange' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('exchange')}
            className={cn(mode === 'exchange' && 'ocean-button', 'text-xs sm:text-sm px-3 sm:px-4')}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Trade Goods
          </Button>
        </div>
      )}

      {/* Trading Post — Dock Table Surface */}
      <div className={cn(
        "relative rounded-xl wood-plank-texture border-2 border-primary/30 rope-border",
        isPhone ? "p-3" : "p-6"
      )}>
        {/* Trading Post Label */}
        {!isPhone && (
          <div className="absolute -top-3 left-4">
            <span className="font-pirate text-primary text-sm px-3 py-1 bg-card rounded-full border border-primary/30 shadow-md">
              Trading Post
            </span>
          </div>
        )}

        {/* Supply Ship indicator */}
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-2 sm:px-3 py-1 bg-card rounded-full border border-border shadow-md",
          isPhone ? "mb-2 w-fit mx-auto" : "absolute -top-3 right-4"
        )}>
          <Ship className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
          <span className="text-muted-foreground">Supply:</span>
          <span className="font-bold text-foreground">{deck.length}</span>
        </div>

        {/* Cargo on the dock — horizontal scroll on phone */}
        <div className={cn(
          "min-h-[80px] sm:min-h-[140px]",
          isPhone 
            ? "flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1" 
            : "flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4"
        )}>
          <AnimatePresence mode="popLayout">
            {market.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                className={cn(isPhone && "flex-shrink-0")}
              >
                <CargoObject
                  card={card}
                  selected={selectedMarketCards.includes(card.id)}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!isPlayerTurn || phase !== 'playing'}
                  size={cargoSize}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {market.length === 0 && (
            <div className="text-muted-foreground text-sm italic">
              No cargo at the trading post
            </div>
          )}
        </div>

        {/* Commandeer Fleet */}
        {ships.length > 0 && isPlayerTurn && phase === 'playing' && mode === 'take' && (
          <motion.div
            className="mt-3 sm:mt-4 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              onClick={handleCommandeerFleet}
              variant="outline"
              size="sm"
              className="border-accent text-accent hover:bg-accent/10 text-xs sm:text-sm"
            >
              <Anchor className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Commandeer Fleet ({ships.length})
            </Button>
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
          
          <div className={cn(
            isPhone
              ? "flex gap-2 overflow-x-auto scrollbar-hide pb-2"
              : "flex flex-wrap gap-3 justify-center"
          )}>
            {currentPlayer.hand.map((card) => (
              <div key={card.id} className={cn(isPhone && "flex-shrink-0")}>
                <CargoObject
                  card={card}
                  selected={selectedHandCards.includes(card.id)}
                  onClick={() => toggleHandCard(card.id)}
                  size={isPhone ? 'sm' : 'sm'}
                />
              </div>
            ))}
            {currentPlayer.ships.map((card) => (
              <div key={card.id} className={cn(isPhone && "flex-shrink-0")}>
                <CargoObject
                  card={card}
                  selected={selectedHandCards.includes(card.id)}
                  onClick={() => toggleHandCard(card.id)}
                  size={isPhone ? 'sm' : 'sm'}
                />
              </div>
            ))}
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
