import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Card, GoodsType, INITIAL_TOKEN_VALUES } from '@/types/game';
import { cn } from '@/lib/utils';
import { Package, Lock, Unlock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnloadChestProps {
  selectedCards: string[];
  player: { hand: Card[]; tokens: { value: number }[]; bonusTokens: { value: number }[] };
  onUnload: () => void;
  onClear: () => void;
  canUnload: boolean;
  allSameType: boolean;
  layout?: 'phone' | 'tablet' | 'desktop';
}

// Sparkle particle component
const SparkleParticle = ({ index, delay }: { index: number; delay: number }) => {
  const angle = (index / 8) * Math.PI * 2;
  const distance = 30 + Math.random() * 40;
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-primary"
      style={{
        left: '50%',
        top: '50%',
        filter: 'blur(0.5px)',
      }}
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
        scale: [1, 1.3, 0],
      }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    />
  );
};

// Flipping token animation
const FlippingToken = ({ 
  value, 
  delay, 
  type 
}: { 
  value: number; 
  delay: number; 
  type: 'doubloon' | 'bonus';
}) => (
  <motion.div
    className={cn(
      'w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs',
      type === 'doubloon'
        ? 'bg-gradient-to-br from-primary/80 to-primary border-primary/60 text-primary-foreground'
        : 'bg-gradient-to-br from-accent/80 to-accent border-accent/60 text-accent-foreground'
    )}
    initial={{ opacity: 0, rotateX: 180, y: -30, scale: 0.5 }}
    animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
    transition={{
      delay,
      type: 'spring',
      stiffness: 350,
      damping: 18,
    }}
    style={{ perspective: 200 }}
  >
    +{value}
  </motion.div>
);

// Animated score counter
const TickingScore = ({ value, label }: { value: number; label: string }) => {
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      const controls = animate(motionValue, value, {
        duration: 0.6,
        ease: 'easeOut',
        onUpdate: (latest) => setDisplay(Math.round(latest)),
      });
      prevValue.current = value;
      return controls.stop;
    } else {
      setDisplay(value);
      motionValue.set(value);
    }
  }, [value, motionValue]);

  return (
    <span className="text-muted-foreground flex items-center gap-1">
      {label === 'Doubloons' && <img src="/images/doubloons.webp" alt="Doubloons" className="w-7 h-7 object-contain -my-2" />}
      {label === 'Comm' && <img src="/images/commissions.webp" alt="Commissions" className="w-7 h-7 object-contain -my-2" />}
      {label !== 'Doubloons' && label !== 'Comm' && <>{label}: </>}
      <span className="font-bold text-primary">{display}</span>
    </span>
  );
};

export const UnloadChest = ({
  selectedCards,
  player,
  onUnload,
  onClear,
  canUnload,
  allSameType,
  layout = 'desktop',
}: UnloadChestProps) => {
  const [isUnloading, setIsUnloading] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [earnedTokens, setEarnedTokens] = useState<{ value: number; type: 'doubloon' | 'bonus' }[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const { lastAction, tokenStacks } = useGameStore();
  const [announcement, setAnnouncement] = useState('');
  const processedAction = useRef<typeof lastAction>(null);

  const isPhone = layout === 'phone';
  const hasSelection = selectedCards.length > 0;

  // Track the sell action to trigger animations
  useEffect(() => {
    if (lastAction?.type === 'sell' && lastAction.cardsInvolved && lastAction !== processedAction.current) {
      processedAction.current = lastAction;
      setIsUnloading(true);
      setShowSparkles(true);

      const tokens: { value: number; type: 'doubloon' | 'bonus' }[] = [];
      if (lastAction.tokensEarned) {
        tokens.push({ value: lastAction.tokensEarned, type: 'doubloon' });
      }
      if (lastAction.bonusEarned) {
        tokens.push({ value: lastAction.bonusEarned, type: 'bonus' });
      }
      setEarnedTokens(tokens);

      // Accessibility announcement
      const cargoType = lastAction.cardsInvolved[0]?.type || 'cargo';
      const count = lastAction.cardsInvolved.length;
      const coinText = lastAction.tokensEarned ? `+${lastAction.tokensEarned} coins` : '';
      const bonusText = lastAction.bonusEarned ? ` +${lastAction.bonusEarned} bonus` : '';
      setAnnouncement(`Unloaded ${count} ${cargoType}. ${coinText}.${bonusText}`);

      const timer = setTimeout(() => {
        setIsUnloading(false);
        setShowSparkles(false);
        setEarnedTokens([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const selectedType = hasSelection
    ? player.hand.find((c) => selectedCards.includes(c.id))?.type
    : null;

  const CARGO_LABELS: Record<string, string> = {
    cannonballs: 'Cannonballs', rum: 'Rum', silver: 'Silver',
    silks: 'Silk', gold: 'Gold', gemstones: 'Gems',
  };

  const handleUnload = useCallback(() => {
    setShowConfirm(false);
    onUnload();
  }, [onUnload]);

  // Calculate expected doubloon value for confirmation
  const getExpectedValue = useCallback(() => {
    if (!hasSelection || !selectedType) return 0;
    const type = selectedType as GoodsType;
    const stack = tokenStacks?.[type];
    if (!stack) return 0;
    return stack.slice(0, selectedCards.length).reduce((sum, t) => sum + t.value, 0);
  }, [selectedCards, selectedType, tokenStacks, hasSelection]);


  return (
    <div className={cn(
      'relative',
      isPhone ? 'mt-2' : 'mt-3 sm:mt-4'
    )}>
      {/* Accessibility live region */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Chest Area */}
      <motion.div
        className={cn(
          'relative rounded-xl border-2 overflow-hidden transition-colors',
          isPhone ? 'p-2' : 'p-3',
          hasSelection && canUnload
            ? 'border-primary/50 bg-primary/5'
            : 'border-border bg-muted/20',
          isUnloading && 'border-primary bg-primary/10'
        )}
        animate={isUnloading ? {
          // Chest lid bump
          scale: [1, 1.03, 0.98, 1.01, 1],
        } : {}}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Wood texture for chest */}
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(139,90,43,0.15)_6px,rgba(139,90,43,0.15)_7px)]" />

        {/* Metal bands */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className={cn(
          'relative flex items-center gap-2',
          isPhone ? 'flex-col' : 'justify-between'
        )}>
          {/* Validation hints */}
          <div className="flex items-center gap-2">
            {hasSelection && !allSameType && (
              <span className={cn(
                'text-destructive font-bold',
                isPhone ? 'text-xs' : 'text-sm'
              )}>Same type only</span>
            )}
            {hasSelection && allSameType && selectedType && (
              <div className="flex items-center gap-1.5">
                <img
                  src={`/Icons/${selectedType}.webp`}
                  alt={selectedType}
                  className={cn('object-contain', isPhone ? 'w-6 h-6' : 'w-7 h-7')}
                />
                <span className={cn(
                  'text-foreground font-bold',
                  isPhone ? 'text-xs' : 'text-sm'
                )}>
                  {selectedCards.length}× {CARGO_LABELS[selectedType] || selectedType}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!canUnload}
              className={cn(
                'game-button',
                isPhone ? 'text-xs h-8' : 'text-sm'
              )}
              size="sm"
            >
              <img src="/images/supply.png" alt="Sell Cargo" className={cn(isPhone ? 'w-4 h-4' : 'w-5 h-5', 'mr-1 object-contain')} />
              Sell Cargo{hasSelection ? ` (${selectedCards.length})` : ''}
            </Button>

            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground text-xs h-8"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Sell Confirmation Dialog */}
          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-pirate text-primary flex items-center gap-2">
                  {selectedType && (
                    <img src={`/Icons/${selectedType}.png`} alt="" className="w-7 h-7 object-contain" />
                  )}
                  Sell Cargo?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-foreground/80">
                  Sell <strong className="text-primary">{selectedCards.length}× {selectedType ? CARGO_LABELS[selectedType] || selectedType : ''}</strong> for{' '}
                  <strong className="text-primary">{getExpectedValue()} doubloons</strong>
                  {selectedCards.length >= 3 && (
                    <span className="block mt-1 text-accent">+ Commission Seal bonus!</span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnload} className="game-button">
                  Sell Cargo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Sparkle particles on unload */}
        <AnimatePresence>
          {showSparkles && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <SparkleParticle key={i} index={i} delay={i * 0.05} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Earned tokens flipping onto table */}
        <AnimatePresence>
          {earnedTokens.length > 0 && (
            <motion.div
              className={cn(
                'flex items-center justify-center gap-2 mt-2',
                isPhone ? 'gap-1.5' : 'gap-3'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {earnedTokens.map((token, i) => (
                <FlippingToken
                  key={`${token.type}-${i}`}
                  value={token.value}
                  delay={token.type === 'bonus' ? 0.6 : 0.2}
                  type={token.type}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
};
