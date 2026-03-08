import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tutorial } from '@/components/game/Tutorial';
import { useTutorialStore } from '@/store/tutorialStore';
import { useGameStore } from '@/store/gameStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { TradingPost } from '@/components/game/TradingPost';
import { ShipsHold } from '@/components/game/ShipsHold';
import { ScoreBoard } from '@/components/game/ScoreBoard';
import { BonusTokens } from '@/components/game/BonusTokens';
import { TreasureStack } from '@/components/game/TreasureStack';
import { GoodsType } from '@/types/game';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import bannerLogo from '@/assets/BannerLogo.png';

const GOODS_ORDER: GoodsType[] = ['gemstones', 'gold', 'silver', 'silks', 'cannonballs', 'rum'];

const TutorialPage = () => {
  const navigate = useNavigate();
  const { isActive, start, skip } = useTutorialStore();
  const { startGame, resetGame, players, tokenStacks, bonusTokens, optionalRules, phase } = useGameStore();
  const isMobile = useIsMobile();

  // Start a real game to populate the store, then start tutorial
  useEffect(() => {
    startGame('Captain', 'easy', { stormRule: true, pirateRaid: true, treasureChest: true });
    start();
    return () => {
      resetGame();
    };
  }, []);

  // Navigate home when tutorial ends
  useEffect(() => {
    if (!isActive) {
      const t = setTimeout(() => navigate('/'), 200);
      return () => clearTimeout(t);
    }
  }, [isActive, navigate]);

  const humanPlayer = players[0];
  const opponentPlayer = players[1];

  return (
    <div
      className="min-h-screen w-screen overflow-y-auto flex flex-col"
      style={{ backgroundImage: 'url(/images/wood-bg.png)', backgroundSize: '100% auto', backgroundRepeat: 'repeat-y' }}
    >
      {/* Tutorial overlay */}
      <Tutorial />

      {/* Header */}
      <header className="flex items-center justify-between py-2 px-4 border-b border-border bg-card/80 flex-shrink-0">
        <img src={bannerLogo} alt="Privateer" className="h-8 object-contain" />
        <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
          <X className="w-4 h-4 mr-1" /> Skip
        </Button>
      </header>

      {/* Real game board — pointer-events-none to prevent interaction */}
      <div className="flex-1 pointer-events-none p-2 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">

          {/* ═══ PHONE LAYOUT ═══ */}
          <div className="block md:hidden space-y-3">
            {/* Trading Post */}
            <div data-tutorial-id="tutorial-trading-post">
              <TradingPost layout="phone" />
            </div>

            {/* Player's Hold */}
            <div data-tutorial-id="tutorial-ships-hold">
              {humanPlayer && (
                <ShipsHold player={humanPlayer} isCurrentPlayer={true} layout="phone" />
              )}
            </div>

            {/* Market Prices */}
            <div data-tutorial-id="tutorial-market-prices">
              <div className="p-3 rounded-xl border border-primary/20 relative overflow-hidden" style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
                <div className="absolute inset-0 bg-background/40" />
                <div className="relative z-10">
                  <h3 className="font-pirate text-lg text-primary mb-3 text-center">Market Prices</h3>
                  <div className="grid grid-cols-3 gap-3 place-items-center">
                    {GOODS_ORDER.map((type) => (
                      <TreasureStack key={type} type={type} tokens={tokenStacks[type]} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Seals */}
            <div data-tutorial-id="tutorial-bonus">
              <BonusTokens threeCards={bonusTokens.three} fourCards={bonusTokens.four} fiveCards={bonusTokens.five} />
            </div>

            {/* Opponent Hold */}
            <div>
              {opponentPlayer && (
                <ShipsHold player={opponentPlayer} isCurrentPlayer={false} isOpponent layout="phone" />
              )}
            </div>

            {/* Scoreboard */}
            <div>
              <ScoreBoard />
            </div>

            {/* Optional Rules */}
            <div className="grid grid-cols-3 gap-2">
              <div data-tutorial-id="tutorial-storm" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                <img src="/Icons/Storm.png" alt="Storm" className="w-7 h-7 object-contain mx-auto mb-1" />
                <span className="text-[10px] font-bold text-primary">Storm</span>
              </div>
              <div data-tutorial-id="tutorial-raid" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                <img src="/Icons/Raid.png" alt="Raid" className="w-7 h-7 object-contain mx-auto mb-1" />
                <span className="text-[10px] font-bold text-primary">Raid</span>
              </div>
              <div data-tutorial-id="tutorial-treasure" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                <img src="/Icons/bonus.png" alt="Treasure" className="w-7 h-7 object-contain mx-auto mb-1" />
                <span className="text-[10px] font-bold text-primary">Treasure</span>
              </div>
            </div>
          </div>

          {/* ═══ TABLET LAYOUT ═══ */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-3 gap-4">
              {/* Left: Opponent + ScoreBoard */}
              <aside className="col-span-1 space-y-4">
                {opponentPlayer && (
                  <ShipsHold player={opponentPlayer} isCurrentPlayer={false} isOpponent layout="tablet" />
                )}
                <ScoreBoard />
              </aside>

              {/* Center: Trading Post + Player Hold */}
              <main className="col-span-1 space-y-4">
                <div data-tutorial-id="tutorial-trading-post">
                  <TradingPost layout="tablet" />
                </div>
                <div data-tutorial-id="tutorial-ships-hold">
                  {humanPlayer && (
                    <ShipsHold player={humanPlayer} isCurrentPlayer={true} layout="tablet" />
                  )}
                </div>
              </main>

              {/* Right: Market + Bonuses */}
              <aside className="col-span-1 space-y-4">
                <div data-tutorial-id="tutorial-market-prices">
                  <div className="p-3 rounded-xl border border-primary/20 relative overflow-hidden" style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
                    <div className="absolute inset-0 bg-background/40" />
                    <div className="relative z-10">
                      <h3 className="font-pirate text-lg text-primary mb-3 text-center">Market Prices</h3>
                      <div className="grid grid-cols-2 gap-3 place-items-center">
                        {GOODS_ORDER.map((type) => (
                          <TreasureStack key={type} type={type} tokens={tokenStacks[type]} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div data-tutorial-id="tutorial-bonus">
                  <BonusTokens threeCards={bonusTokens.three} fourCards={bonusTokens.four} fiveCards={bonusTokens.five} />
                </div>
                {/* Optional rules */}
                <div className="grid grid-cols-3 gap-2">
                  <div data-tutorial-id="tutorial-storm" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                    <img src="/Icons/Storm.png" alt="Storm" className="w-7 h-7 object-contain mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-primary">Storm</span>
                  </div>
                  <div data-tutorial-id="tutorial-raid" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                    <img src="/Icons/Raid.png" alt="Raid" className="w-7 h-7 object-contain mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-primary">Raid</span>
                  </div>
                  <div data-tutorial-id="tutorial-treasure" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                    <img src="/Icons/bonus.png" alt="Treasure" className="w-7 h-7 object-contain mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-primary">Treasure</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* ═══ DESKTOP LAYOUT ═══ */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-6">
              {/* Left sidebar: Market + Bonuses */}
              <aside className="col-span-1 space-y-4">
                <div data-tutorial-id="tutorial-market-prices">
                  <div className="p-4 rounded-xl border border-primary/20 relative overflow-hidden" style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
                    <div className="absolute inset-0 bg-background/40" />
                    <div className="relative z-10">
                      <h3 className="font-pirate text-lg text-primary mb-4 text-center">Market Prices</h3>
                      <div className="grid grid-cols-2 gap-4 place-items-center">
                        {GOODS_ORDER.map((type) => (
                          <TreasureStack key={type} type={type} tokens={tokenStacks[type]} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div data-tutorial-id="tutorial-bonus">
                  <BonusTokens threeCards={bonusTokens.three} fourCards={bonusTokens.four} fiveCards={bonusTokens.five} />
                </div>
                {/* Optional rules */}
                <div className="grid grid-cols-3 gap-2">
                  <div data-tutorial-id="tutorial-storm" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                    <img src="/Icons/Storm.png" alt="Storm" className="w-7 h-7 object-contain mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-primary">Storm</span>
                  </div>
                  <div data-tutorial-id="tutorial-raid" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                    <img src="/Icons/Raid.png" alt="Raid" className="w-7 h-7 object-contain mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-primary">Raid</span>
                  </div>
                  <div data-tutorial-id="tutorial-treasure" className="p-2 rounded-lg border border-primary/20 bg-card text-center">
                    <img src="/Icons/bonus.png" alt="Treasure" className="w-7 h-7 object-contain mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-primary">Treasure</span>
                  </div>
                </div>
              </aside>

              {/* Center: Trading Post + Player Hold */}
              <main className="col-span-2 space-y-6">
                <div data-tutorial-id="tutorial-trading-post">
                  <TradingPost layout="desktop" />
                </div>
                <div data-tutorial-id="tutorial-ships-hold">
                  {humanPlayer && (
                    <ShipsHold player={humanPlayer} isCurrentPlayer={true} layout="desktop" />
                  )}
                </div>
              </main>

              {/* Right sidebar: Opponent + Scoreboard */}
              <aside className="col-span-1 space-y-4">
                {opponentPlayer && (
                  <ShipsHold player={opponentPlayer} isCurrentPlayer={false} isOpponent layout="desktop" />
                )}
                <ScoreBoard />
              </aside>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
