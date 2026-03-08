import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tutorial } from '@/components/game/Tutorial';
import { useTutorialStore } from '@/store/tutorialStore';
import bannerLogo from '@/assets/BannerLogo.png';
import cardBack from '@/assets/card-back.png';

// Token images
import rumTokens from '@/assets/tokens/rum.png';
import ironTokens from '@/assets/tokens/iron.png';
import silverTokens from '@/assets/tokens/silver.png';
import silkTokens from '@/assets/tokens/silk.png';
import goldTokens from '@/assets/tokens/gold.png';
import gemTokens from '@/assets/tokens/gems.png';
import shipTokens from '@/assets/tokens/ship.png';

const goodsIcons: Record<string, string> = {
  rum: rumTokens,
  iron: ironTokens,
  silver: silverTokens,
  silk: silkTokens,
  gold: goldTokens,
  gems: gemTokens,
  ships: shipTokens,
};

const TutorialPage = () => {
  const navigate = useNavigate();
  const { isActive, start } = useTutorialStore();

  // Auto-start tutorial on mount
  useEffect(() => {
    start();
  }, [start]);

  // Navigate home when tutorial ends
  useEffect(() => {
    if (!isActive) {
      // Small delay so the last step animates out
      const t = setTimeout(() => navigate('/'), 200);
      return () => clearTimeout(t);
    }
  }, [isActive, navigate]);

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundImage: 'url(/images/wood-bg.png)', backgroundSize: '100% auto', backgroundRepeat: 'repeat-y' }}
    >
      {/* Tutorial overlay */}
      <Tutorial />

      {/* Header */}
      <header className="flex items-center justify-center py-2 px-4 border-b border-border bg-card/80 flex-shrink-0">
        <img src={bannerLogo} alt="Privateer" className="h-8 object-contain" />
      </header>

      {/* Main mock board */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 min-h-0">

        {/* Left column: Market + Seals + Optional rules */}
        <div className="lg:w-1/4 flex flex-col gap-3 min-h-0">
          {/* Market Prices */}
          <div
            data-tutorial-id="tutorial-market-prices"
            className="p-3 rounded-xl border border-primary/20 relative overflow-hidden flex-1"
            style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}
          >
            <div className="absolute inset-0 bg-background/40 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-pirate text-base text-primary mb-2 text-center">Market Prices</h3>
              <div className="grid grid-cols-3 gap-2 place-items-center">
                {['gems', 'gold', 'silver', 'silk', 'iron', 'rum'].map((type) => (
                  <div key={type} className="text-center">
                    <img src={goodsIcons[type]} alt={type} className="w-8 h-8 object-contain mx-auto mb-1" />
                    <div className="text-[10px] text-muted-foreground capitalize">{type}</div>
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary/60 border border-primary/30" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commission Seals */}
          <div
            data-tutorial-id="tutorial-bonus"
            className="p-3 rounded-xl border border-primary/20 bg-card"
          >
            <h3 className="font-pirate text-base text-primary mb-2 text-center">Commission Seals</h3>
            <div className="flex justify-center gap-3">
              {[
                { label: '3-card', img: '/Icons/RedSeal.png' },
                { label: '4-card', img: '/Icons/SilverSeal.png' },
                { label: '5-card', img: '/Icons/GoldSeal.png' },
              ].map((b) => (
                <div key={b.label} className="text-center">
                  <img src={b.img} alt={b.label} className="w-8 h-8 object-contain mx-auto" />
                  <span className="text-[10px] text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
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

        {/* Center column: Opponent + Trading Post + Player Hold */}
        <div className="lg:flex-1 flex flex-col gap-3 min-h-0">

          {/* Opponent area */}
          <div className="p-3 rounded-xl border border-border bg-card/60 flex-shrink-0">
            <h3 className="font-pirate text-sm text-muted-foreground mb-2 text-center">Opponent's Hold</h3>
            <div className="flex gap-2 justify-center">
              {[...Array(5)].map((_, i) => (
                <img key={i} src={cardBack} alt="Hidden card" className="w-10 h-14 rounded object-cover opacity-70" />
              ))}
            </div>
          </div>

          {/* Trading Post */}
          <div
            data-tutorial-id="tutorial-trading-post"
            className="p-4 rounded-xl border border-primary/20 relative overflow-hidden flex-1"
            style={{ backgroundImage: 'url(/images/trading-post-bg.png)', backgroundSize: '100% 100%' }}
          >
            <div className="absolute inset-0 bg-background/30 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-pirate text-lg text-primary">Trading Post</h3>
                <span className="text-xs text-muted-foreground bg-card/60 px-2 py-0.5 rounded">Supply: 24 cards</span>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                {['rum', 'gold', 'silk', 'ships', 'iron'].map((type) => (
                  <div key={type} className="bg-card/70 rounded-lg p-2 text-center w-16 border border-primary/10">
                    <img src={goodsIcons[type]} alt={type} className="w-10 h-10 object-contain mx-auto mb-1" />
                    <span className="text-xs text-foreground/70 capitalize">{type}</span>
                  </div>
                ))}
              </div>

              {/* Action labels */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                <span data-tutorial-id="tutorial-claim" className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                  Claim Cargo
                </span>
                <span data-tutorial-id="tutorial-commandeer" className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                  Commandeer Fleet
                </span>
                <span data-tutorial-id="tutorial-trade" className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">
                  Trade Goods
                </span>
              </div>
            </div>
          </div>

          {/* Player's Ship's Hold */}
          <div
            data-tutorial-id="tutorial-ships-hold"
            className="p-4 rounded-xl border border-primary/20 relative overflow-hidden flex-shrink-0"
            style={{ backgroundImage: 'url(/images/cargo-hold-bg.png)', backgroundSize: '100% 100%' }}
          >
            <div className="absolute inset-0 bg-background/30 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-pirate text-lg text-primary mb-3">Your Ship's Hold</h3>
              <div className="flex gap-3 flex-wrap justify-center">
                {['silver', 'rum', 'gems', 'gold'].map((type) => (
                  <div key={type} className="bg-card/70 rounded-lg p-2 text-center w-16 border border-primary/10">
                    <img src={goodsIcons[type]} alt={type} className="w-10 h-10 object-contain mx-auto mb-1" />
                    <span className="text-xs text-foreground/70 capitalize">{type}</span>
                  </div>
                ))}
                {[...Array(3)].map((_, i) => (
                  <div key={`empty-${i}`} className="bg-muted/30 border border-dashed border-border rounded-lg p-2 w-16 flex items-center justify-center h-[60px]">
                    <span className="text-[10px] text-muted-foreground">Empty</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center">
                <span data-tutorial-id="tutorial-sell" className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Sell Cargo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Scoreboard */}
        <div className="lg:w-1/4 flex flex-col gap-3 min-h-0">
          <div className="p-3 rounded-xl border border-primary/20 bg-card">
            <h3 className="font-pirate text-base text-primary mb-2 text-center">Scoreboard</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-bold text-primary">You</span>
                <span className="text-sm text-foreground">12 doubloons</span>
              </div>
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-bold text-muted-foreground">Opponent</span>
                <span className="text-sm text-foreground">8 doubloons</span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-primary/20 bg-card">
            <h3 className="font-pirate text-base text-primary mb-2 text-center">Round</h3>
            <p className="text-center text-sm text-foreground/70">Round 1 of 3</p>
            <p className="text-center text-xs text-muted-foreground mt-1">Turn 4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
