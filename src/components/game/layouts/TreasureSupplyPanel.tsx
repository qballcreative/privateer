/** TreasureSupplyPanel — Market prices display: all 6 doubloon token stacks + bonus commission seals. */
import { memo } from 'react';
import { TreasureStack } from '../TreasureStack';
import { BonusTokens } from '../BonusTokens';
import { cn } from '@/lib/utils';
import { TreasureSupplyPanelProps, GOODS_ORDER } from './types';

export const TreasureSupplyPanel = memo(({ compact = false, tokenStacks, bonusTokens }: TreasureSupplyPanelProps) => (
  <div className="space-y-4">
    <div data-tutorial-id="tutorial-market-prices" className={cn("p-4 rounded-xl border border-primary/20 relative overflow-hidden", compact && "p-3")} style={{ backgroundImage: 'url(/images/ledger-bg.webp)', backgroundSize: '100% 100%' }}>
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="relative z-10">
        <h3 className="font-pirate text-lg text-primary mb-4 text-center" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          Market Prices
        </h3>
        <div className={cn("grid gap-4 place-items-center", compact ? "grid-cols-3" : "grid-cols-2")}>
          {GOODS_ORDER.map((type) => (
            <TreasureStack key={type} type={type} tokens={tokenStacks[type]} />
          ))}
        </div>
      </div>
    </div>

    <BonusTokens
      threeCards={bonusTokens.three}
      fourCards={bonusTokens.four}
      fiveCards={bonusTokens.five}
    />

  </div>
));
TreasureSupplyPanel.displayName = 'TreasureSupplyPanel';
