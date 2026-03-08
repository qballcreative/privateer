import { motion, AnimatePresence } from 'framer-motion';
import { Token, GoodsType } from '@/types/game';
import { cn } from '@/lib/utils';
import { Wine, CircleDot, Shirt, Coins, Gem } from 'lucide-react';

interface TreasureStackProps {
  type: GoodsType;
  tokens: Token[];
}

// Token configuration with cargo-themed colors
const treasureConfig: Record<GoodsType, { 
  icon: React.ReactNode; 
  label: string;
}> = {
  rum: {
    icon: <Wine className="w-3.5 h-3.5" />,
    label: 'Rum',
  },
  cannonballs: {
    icon: <CircleDot className="w-3.5 h-3.5" />,
    label: 'Iron',
  },
  silks: {
    icon: <Shirt className="w-3.5 h-3.5" />,
    label: 'Silk',
  },
  silver: {
    icon: <Coins className="w-3.5 h-3.5" />,
    label: 'Silver',
  },
  gold: {
    icon: <Coins className="w-3.5 h-3.5" />,
    label: 'Gold',
  },
  gemstones: {
    icon: <Gem className="w-3.5 h-3.5" />,
    label: 'Gems',
  },
};

export const TreasureStack = ({ type, tokens }: TreasureStackProps) => {
  const config = treasureConfig[type];
  const topToken = tokens[0];
  const isEmpty = tokens.length === 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Leather label */}
      <div className="px-2 py-0.5 rounded leather-texture">
        <span className="text-xs text-foreground/90 font-medium">{config.label}</span>
      </div>
      
      {/* Doubloon stack */}
      <div className="relative w-14 h-14">
        {/* Stacked coins effect */}
        {tokens.slice(0, 4).reverse().map((token, index) => (
          <motion.div
            key={token.id}
            className={cn(
              'absolute w-11 h-11 rounded-full border-2',
              'bg-gradient-to-br flex items-center justify-center',
              'doubloon',
              config.gradientClass,
              config.coinColor
            )}
            style={{
              bottom: index * 3,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: index,
            }}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
          >
            {/* Show value and icon only on top coin */}
            {index === tokens.slice(0, 4).length - 1 && topToken && (
              <>
                <span className="text-foreground font-bold text-sm drop-shadow-md">
                  {topToken.value}
                </span>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                  {config.icon}
                </div>
              </>
            )}
          </motion.div>
        ))}

        {/* Empty state - coin outline */}
        <AnimatePresence>
          {isEmpty && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-muted-foreground text-[10px]">Empty</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Count indicator */}
      <span className="text-xs text-primary font-bold">{tokens.length} left</span>
    </div>
  );
};
