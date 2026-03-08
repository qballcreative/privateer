import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, HAND_LIMIT } from '@/types/game';
import { GameCard } from './GameCard';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Anchor, ArrowLeftRight, Hand, AlertTriangle } from 'lucide-react';

export const Market = () => {
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
      // Ships cannot be taken individually - must use "Take All Ships"
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

  const handleTakeAllShips = () => {
    if (ships.length > 0 && isPlayerTurn) {
      takeAllShips();
    }
  };

  // Calculate if exchange would exceed hand limit
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

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      {isPlayerTurn && phase === 'playing' && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            variant={mode === 'take' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('take');
              setSelectedMarketCards([]);
              setSelectedHandCards([]);
            }}
            className={cn(mode === 'take' && 'game-button')}
          >
            <Hand className="w-4 h-4 mr-1" />
            Take
          </Button>
          <Button
            variant={mode === 'exchange' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('exchange')}
            className={cn(mode === 'exchange' && 'ocean-button')}
          >
            <ArrowLeftRight className="w-4 h-4 mr-1" />
            Exchange
          </Button>
        </div>
      )}

      {/* Market Area */}
      <div className="relative p-6 rounded-xl bg-card/80 border border-primary/20">
        <div className="absolute -top-3 left-4">
          <span className="font-pirate text-primary text-sm px-3 py-1 bg-card rounded-full border border-primary/30">
            Trading Post
          </span>
        </div>

        {/* Deck indicator */}
        <div className="absolute -top-3 right-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 bg-card rounded-full border border-border">
            Deck: {deck.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 min-h-[140px] pt-4">
          <AnimatePresence mode="popLayout">
            {market.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: -20, rotateY: 180 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 200,
                }}
              >
                <GameCard
                  card={card}
                  selected={selectedMarketCards.includes(card.id)}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!isPlayerTurn || phase !== 'playing'}
                  size="lg"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Ship action */}
        {ships.length > 0 && isPlayerTurn && phase === 'playing' && mode === 'take' && (
          <motion.div
            className="mt-4 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              onClick={handleTakeAllShips}
              variant="outline"
              size="sm"
              className="border-accent text-accent hover:bg-accent/10"
            >
              <Anchor className="w-4 h-4 mr-1" />
              Take All Ships ({ships.length})
            </Button>
          </motion.div>
        )}
      </div>

      {/* Exchange Mode - Hand Selection */}
      {mode === 'exchange' && isPlayerTurn && phase === 'playing' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-lg bg-accent/10 border border-accent/20"
        >
          <p className="text-sm text-accent mb-3">
            Select cards from your hand to exchange ({selectedHandCards.length}/{selectedMarketCards.length})
          </p>
          
          {wouldExceedHandLimit && selectedMarketCards.length > 0 && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-2 bg-destructive/10 rounded">
              <AlertTriangle className="w-4 h-4" />
              <span>Exchange would exceed hand limit of {HAND_LIMIT} cards. Select more cards from your hand or ships.</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center">
            {currentPlayer.hand.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                selected={selectedHandCards.includes(card.id)}
                onClick={() => toggleHandCard(card.id)}
                size="sm"
              />
            ))}
            
            {/* Ships can be used in exchange */}
            {currentPlayer.ships.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                selected={selectedHandCards.includes(card.id)}
                onClick={() => toggleHandCard(card.id)}
                size="sm"
              />
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <Button
              onClick={handleExchange}
              disabled={selectedMarketCards.length < 2 || 
                       selectedHandCards.length !== selectedMarketCards.length ||
                       wouldExceedHandLimit}
              className="ocean-button"
              size="sm"
            >
              Complete Exchange
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedMarketCards([]);
                setSelectedHandCards([]);
                setMode('take');
              }}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
