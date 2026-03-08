import { motion, AnimatePresence } from 'framer-motion';
import { ActionDisplay, Card } from '@/types/game';
import { GameCard } from './GameCard';
import { ArrowRight, ArrowDown, Coins, Star, CloudLightning, Crosshair, Ship, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionNotificationProps {
  action: ActionDisplay | null;
  show: boolean;
}

const actionIcons = {
  'take': Package,
  'take-ships': Ship,
  'exchange': ArrowRight,
  'sell': Coins,
  'raid': Crosshair,
  'storm': CloudLightning,
};

const actionColors = {
  'take': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  'take-ships': 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
  'exchange': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  'sell': 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  'raid': 'from-red-500/20 to-red-600/20 border-red-500/30',
  'storm': 'from-blue-400/20 to-indigo-500/20 border-blue-400/30',
};

const actionIconColors = {
  'take': 'text-blue-400',
  'take-ships': 'text-cyan-400',
  'exchange': 'text-purple-400',
  'sell': 'text-amber-400',
  'raid': 'text-red-400',
  'storm': 'text-blue-400',
};

const CardRow = ({ cards, label }: { cards: Card[]; label?: string }) => (
  <div className="flex flex-col items-center gap-1">
    {label && <span className="text-xs text-muted-foreground">{label}</span>}
    <div className="flex gap-1 justify-center flex-wrap">
      {cards.map((card, idx) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300 }}
        >
          <GameCard card={card} size="sm" disabled />
        </motion.div>
      ))}
    </div>
  </div>
);

export const ActionNotification = ({ action, show }: ActionNotificationProps) => {
  if (!action) return null;

  const Icon = actionIcons[action.type];
  const colorClass = actionColors[action.type];
  const iconColor = actionIconColors[action.type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-20 inset-x-0 z-50 pointer-events-none flex justify-center px-4"
        >
          <div className={cn(
            'px-6 py-4 rounded-2xl bg-gradient-to-br border shadow-2xl backdrop-blur-sm',
            'min-w-0 max-w-[400px] w-full sm:w-auto sm:min-w-[280px]',
            colorClass
          )}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                className={cn('p-2 rounded-lg bg-background/50', iconColor)}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-bold text-foreground"
                >
                  {action.playerName}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground"
                >
                  {action.description}
                </motion.p>
              </div>
            </div>

            {/* Cards Display */}
            <div className="space-y-3">
              {/* Simple take action */}
              {action.cardsInvolved && action.cardsInvolved.length > 0 && !action.cardsGiven && (
                <CardRow cards={action.cardsInvolved} />
              )}

              {/* Exchange action with given/received */}
              {action.cardsGiven && action.cardsGiven.length > 0 && (
                <div className="flex items-center gap-2 justify-center">
                  <CardRow cards={action.cardsGiven} label="Gave" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="p-1.5 rounded-full bg-background/50"
                  >
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                  {action.cardsReceived && (
                    <CardRow cards={action.cardsReceived} label="Got" />
                  )}
                </div>
              )}

              {/* Sell action with tokens */}
              {action.type === 'sell' && action.cardsInvolved && (
                <div className="flex items-center gap-3 justify-center">
                  <CardRow cards={action.cardsInvolved} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="p-1.5 rounded-full bg-background/50"
                  >
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="flex flex-col items-center gap-1"
                  >
                    {action.tokensEarned !== undefined && action.tokensEarned > 0 && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-4 h-4" />
                        <span className="font-bold">+{action.tokensEarned}</span>
                      </div>
                    )}
                    {action.bonusEarned !== undefined && action.bonusEarned > 0 && (
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="w-4 h-4" />
                        <span className="font-bold">+{action.bonusEarned}</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
