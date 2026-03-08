import { motion } from 'framer-motion';
import { BonusToken } from '@/types/game';
import { cn } from '@/lib/utils';

interface BonusTokensProps {
  threeCards: BonusToken[];
  fourCards: BonusToken[];
  fiveCards: BonusToken[];
}

const sealImages = {
  three: '/Icons/RedSeal.png',
  four: '/Icons/SilverSeal.png',
  five: '/Icons/GoldSeal.png',
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
      <span className="text-[10px] text-muted-foreground">{tierLabels[tier]} cargo</span>
      
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
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

      <span className="text-xs text-primary font-bold">{tokens.length}</span>
    </div>
  );
};

export const BonusTokens = ({ threeCards, fourCards, fiveCards }: BonusTokensProps) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border">
      <span className="text-sm font-pirate text-primary flex items-center gap-1">
        <img src="/images/commissions.png" alt="Commissions" className="w-7 h-7 object-contain -my-1" />
        Commissions
      </span>
      <MedallionStack tier="three" tokens={threeCards} />
      <MedallionStack tier="four" tokens={fourCards} />
      <MedallionStack tier="five" tokens={fiveCards} />
    </div>
  );
};
