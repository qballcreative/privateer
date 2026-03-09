import { memo } from 'react';
import { TreasureStack } from '../TreasureStack';
import { BonusTokens } from '../BonusTokens';
import { Button } from '@/components/ui/button';
import { Crosshair, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TreasureSupplyPanelProps, GOODS_ORDER } from './types';

export const TreasureSupplyPanel = memo(({ compact = false, tokenStacks, bonusTokens, optionalRules, currentPlayerIndex, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid, isRaidMode, setIsRaidMode }: TreasureSupplyPanelProps) => (
  <div className="space-y-4">
    <div data-tutorial-id="tutorial-market-prices" className={cn("p-4 rounded-xl border border-primary/20 relative overflow-hidden", compact && "p-3")} style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
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

    {optionalRules.pirateRaid && currentPlayerIndex === localPlayerIndex && phase === 'playing' && (
      <div className="p-4 rounded-xl bg-card border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Crosshair className="w-5 h-5 text-red-400" />
          <h3 className="font-pirate text-lg text-red-400">Pirate Raid</h3>
        </div>
        
        {humanPlayer.hasUsedPirateRaid ? (
          <p className="text-xs text-muted-foreground">Already used this game</p>
        ) : canUsePirateRaid() && !currentPlayer.isAI ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Steal one card from your opponent!
            </p>
            <Button
              size="sm"
              variant={isRaidMode ? 'destructive' : 'outline'}
              className={cn(
                'w-full',
                !isRaidMode && 'border-red-500/30 text-red-400 hover:bg-red-500/10'
              )}
              onClick={() => setIsRaidMode(!isRaidMode)}
            >
              {isRaidMode ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Cancel Raid
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4 mr-1" />
                  Activate Raid
                </>
              )}
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {currentPlayer.isAI ? 'Wait for your turn' : 'Cannot raid (hand full or no targets)'}
          </p>
        )}
      </div>
    )}
  </div>
));
TreasureSupplyPanel.displayName = 'TreasureSupplyPanel';
