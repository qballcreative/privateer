import { motion } from 'framer-motion';
import { BonusToken } from '@/types/game';
import { cn } from '@/lib/utils';
import { Medal } from 'lucide-react';

interface BonusTokensProps {
  threeCards: BonusToken[];
  fourCards: BonusToken[];
  fiveCards: BonusToken[];
}

// Commission medallion styling by tier
const medallionConfig = {
  three: {
    label: '3+',
    colorClass: 'from-amber-700 to-amber-900 border-amber-600',
    tierLabel: 'Bronze',
  },
  four: {
    label: '4+',
    colorClass: 'from-gray-300 to-gray-500 border-gray-200',
    tierLabel: 'Silver',
  },
  five: {
    label: '5+',
    colorClass: 'from-yellow-400 to-yellow-600 border-yellow-300',
    tierLabel: 'Gold',
  },
};

const MedallionStack = ({ 
  tier, 
  tokens 
}: { 
  tier: 'three' | 'four' | 'five'; 
  tokens: BonusToken[] 
}) => {
  const config = medallionConfig[tier];
  const isEmpty = tokens.length === 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-muted-foreground">{config.label} cargo</span>
      
      <div className="relative w-10 h-10">
        {/* Stacked medallions */}
        {tokens.slice(0, 3).reverse().map((token, index) => (
          <motion.div
            key={token.id}
            className={cn(
              'absolute w-8 h-8 rounded-full border-2',
              'bg-gradient-to-br shadow-md',
              'flex items-center justify-center',
              config.colorClass
            )}
            style={{
              bottom: index * 2,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: index,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Show medal icon on top medallion */}
            {index === tokens.slice(0, 3).length - 1 && (
              <Medal className="w-4 h-4 text-primary-foreground drop-shadow-sm" />
            )}
          </motion.div>
        ))}

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-dashed border-muted-foreground/30" />
          </div>
        )}
      </div>

      <span className="text-xs text-primary font-bold">{tokens.length}</span>
    </div>
  );
};

export const BonusTokens = ({ threeCards, fourCards, fiveCards }: BonusTokensProps) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border">
      <span className="text-sm font-pirate text-primary">Commissions</span>
      <MedallionStack tier="three" tokens={threeCards} />
      <MedallionStack tier="four" tokens={fourCards} />
      <MedallionStack tier="five" tokens={fiveCards} />
    </div>
  );
};
