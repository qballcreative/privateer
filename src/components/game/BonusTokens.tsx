import { memo } from 'react';
import { motion } from 'framer-motion';
import { BonusToken } from '@/types/game';
import { cn } from '@/lib/utils';

interface BonusTokensProps {
  threeCards: BonusToken[];
  fourCards: BonusToken[];
  fiveCards: BonusToken[];
}

const sealImages = {
  three: '/Icons/redseal.webp',
  four: '/Icons/silverseal.webp',
  five: '/Icons/goldseal.webp',
};

const tierLabels = {
  three: '3+',
  four: '4+',
  five: '5+',
};

const MedallionStack = ({ 
  tier, 
  tokens 
}: { 
  tier: 'three' | 'four' | 'five'; 
  tokens: BonusToken[] 
}) => {
  const isEmpty = tokens.length === 0;
  const sealSrc = sealImages[tier];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold text-foreground/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{tierLabels[tier]} cargo</span>
      
      <div className="relative w-10 h-10">
        {/* Stacked seals */}
        {tokens.slice(0, 3).reverse().map((token, index) => (
          <motion.div
            key={token.id}
            className="absolute w-10 h-10"
            style={{
              bottom: index * 2,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: index,
            }}
            initial={false}
            animate={{ scale: 1 }}
          >
            <img src={sealSrc} alt={`${tierLabels[tier]} seal`} className="w-full h-full object-contain drop-shadow-md" />
          </motion.div>
        ))}

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={sealSrc} alt={`${tierLabels[tier]} seal`} className="w-full h-full object-contain opacity-20" />
          </div>
        )}
      </div>

      <span className="text-xs text-primary font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{tokens.length}</span>
    </div>
  );
};

export const BonusTokens = memo(({ threeCards, fourCards, fiveCards }: BonusTokensProps) => {
  return (
    <div data-tutorial-id="tutorial-bonus" className="p-3 rounded-lg bg-black/40 border border-primary/20">
      <span className="text-lg font-pirate text-primary block text-center mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        Commissions
      </span>
      <div className="flex items-center justify-center gap-4">
        <MedallionStack tier="three" tokens={threeCards} />
        <MedallionStack tier="four" tokens={fourCards} />
        <MedallionStack tier="five" tokens={fiveCards} />
      </div>
    </div>
  );
});
BonusTokens.displayName = 'BonusTokens';
