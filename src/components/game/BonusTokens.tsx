/** BonusTokens — Displays the three tiers of commission seal stacks (3/4/5-card bonuses). */
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
  five: '/Icons/goldseal.webp'
};

const tierLabels = {
  three: '3+',
  four: '4+',
  five: '5+'
};

const MedallionStack = ({
  tier,
  tokens



}: {tier: 'three' | 'four' | 'five';tokens: BonusToken[];}) => {
  const isEmpty = tokens.length === 0;
  const sealSrc = sealImages[tier];

  return (
    <div className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0">
      <div className="px-2 py-0.5 rounded leather-texture">
        <span className="text-xs text-foreground/90 font-medium text-center whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{tierLabels[tier]} cargo</span>
      </div>
      
      <div className="relative w-12 h-14 flex-shrink-0">
        {/* Stacked seals */}
        {tokens.slice(0, 4).reverse().map((token, index) =>
        <motion.div
          key={token.id}
          className="absolute w-11 h-11"
          style={{
            bottom: index * 3,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: index
          }}
          initial={false}
          animate={{ scale: 1 }}>
          
            <img src={sealSrc} alt={`${tierLabels[tier]} seal`} className="w-full h-full object-contain drop-shadow-md text-left" />
          </motion.div>
        )}

        {/* Empty state */}
        {isEmpty &&
        <div className="absolute inset-0 flex items-center justify-center">
            <img src={sealSrc} alt={`${tierLabels[tier]} seal`} className="w-11 h-11 object-contain opacity-20" />
          </div>
        }
      </div>

      <span className="text-xs text-primary font-bold text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{tokens.length} left</span>
    </div>);

};

export const BonusTokens = memo(({ threeCards, fourCards, fiveCards }: BonusTokensProps) => {
  return (
    <div data-tutorial-id="tutorial-bonus" className="p-3 rounded-lg bg-black/40 border border-primary/20 flex flex-col items-center">
      <span className="text-lg font-pirate text-primary text-center mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        Commissions
      </span>
      <div className="flex items-start justify-center w-full gap-2">
        <MedallionStack tier="three" tokens={threeCards} />
        <MedallionStack tier="four" tokens={fourCards} />
        <MedallionStack tier="five" tokens={fiveCards} />
      </div>
    </div>);

});
BonusTokens.displayName = 'BonusTokens';