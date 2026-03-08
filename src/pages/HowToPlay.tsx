import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tutorial } from '@/components/game/Tutorial';
import { useTutorialStore } from '@/store/tutorialStore';
import {
  ArrowLeft, Anchor, Ship, Swords, ArrowLeftRight, Coins,
  Award, Package, CloudLightning, Skull, Gem
} from 'lucide-react';

const sectionAnim = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
};

const HowToPlay = () => {
  const navigate = useNavigate();
  const { start: startTutorial } = useTutorialStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Tutorial />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="font-serif text-xl font-bold text-primary">How to Play</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* Overview */}
        <motion.section {...sectionAnim} className="game-box-card p-6 md:p-8 text-center">
          <Anchor className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3">
            Privateer: Letters of Marque
          </h2>
          <p className="text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            A fast-paced trading duel on the high seas! Buy, sell, and trade cargo to
            earn the most doubloons. Outsmart your opponent to earn your Letters of Marque
            and become the most feared privateer on the seven seas.
          </p>
        </motion.section>

        {/* Game Setup */}
        <motion.section {...sectionAnim}>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <Ship className="w-6 h-6" /> Game Setup
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Trading Post',
                desc: '5 cargo goods are dealt face-up on the dock. This is where you\'ll claim and trade goods each turn.',
                icon: '/Icons/Trade.png',
              },
              {
                title: "Ship's Hold",
                desc: 'Your personal cargo bay. Holds up to 7 goods — ships are stored separately and don\'t count toward the limit.',
                icon: '/Icons/Claim.png',
              },
              {
                title: 'Trading Post Supply',
                desc: 'The remaining cargo deck. When goods leave the Trading Post, they\'re replaced from the Trading Post supply.',
                icon: '/images/supply.png',
              },
              {
                title: 'Market Prices',
                desc: 'Stacked doubloon tokens for each goods type. The top token is the most valuable — prices drop as goods are sold.',
                icon: '/Icons/Doubloon.png',
              },
            ].map((item) => (
              <div key={item.title} className="game-box-card p-4 flex items-start gap-4">
                <img src={item.icon} alt={item.title} className="w-10 h-10 object-contain flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif font-bold text-primary mb-1">{item.title}</h3>
                  <p className="text-sm text-foreground/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Actions */}
        <motion.section {...sectionAnim}>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <Swords className="w-6 h-6" /> Your Turn — Actions Available
          </h2>
          <p className="text-foreground/70 mb-4">On your turn, choose one of these actions:</p>

          <div className="space-y-4">
            <ActionCard
              icon={<img src="/Icons/Claim.png" alt="Claim" className="w-8 h-8 object-contain" />}
              title="Claim Cargo"
              desc="Take 1 good from the Trading Post and add it to your Hold. The empty slot is refilled from the Trading Post supply."
            />
            <ActionCard
              icon={<img src="/Icons/take.png" alt="Commandeer" className="w-8 h-8 object-contain" />}
              title="Commandeer Fleet"
              desc="Take ALL ships from the Trading Post at once! Ships don't count toward your hand limit. The player with the most ships earns 5 bonus doubloons at round end."
            />
            <ActionCard
              icon={<img src="/Icons/exchange.png" alt="Trade" className="w-8 h-8 object-contain" />}
              title="Trade Goods"
              desc="Exchange 2 or more goods between your Hold and the Trading Post. You can use ships from your fleet as part of the trade — great for upgrading cheap goods to expensive ones!"
            />
            <ActionCard
              icon={<img src="/Icons/sell.png" alt="Sell" className="w-8 h-8 object-contain" />}
              title="Sell Cargo"
              desc="Sell 2+ matching goods from your Hold to earn doubloon tokens. For premium goods (gold, silver, gemstones), you must sell at least 2. Sell 3, 4, or 5+ to earn bonus Commission Medallions!"
            />
          </div>
        </motion.section>

        {/* Hand Limit */}
        <motion.section {...sectionAnim} className="game-box-card p-6">
          <h2 className="font-serif text-xl font-bold text-primary mb-2 flex items-center gap-2">
            <Package className="w-5 h-5" /> Hand Limit
          </h2>
          <p className="text-foreground/80">
            Your Ship's Hold can carry at most <strong className="text-primary">7 goods</strong>.
            Ships are stored separately and don't count. If your Hold is full, you'll need to sell
            or trade before claiming more cargo.
          </p>
        </motion.section>

        {/* Scoring */}
        <motion.section {...sectionAnim} className="game-box-card p-6">
          <h2 className="font-serif text-xl font-bold text-primary mb-2 flex items-center gap-2">
            <Coins className="w-5 h-5" /> Scoring
          </h2>
          <p className="text-foreground/80 mb-3">
            When you sell goods, you take tokens from the matching stack. Each stack starts with
            high-value tokens on top — <strong className="text-primary">sell early for the best prices!</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              { name: 'Gems', values: '7, 7, 5, 5, 5', color: 'text-purple-400', img: gemTokens },
              { name: 'Gold', values: '6, 6, 5, 5, 5', color: 'text-yellow-400', img: goldTokens },
              { name: 'Silver', values: '5, 5, 5, 5, 5', color: 'text-gray-300', img: silverTokens },
              { name: 'Silk', values: '5, 3, 3, 2, 2, 1, 1', color: 'text-pink-400', img: silkTokens },
              { name: 'Iron', values: '5, 3, 3, 2, 2, 1, 1', color: 'text-slate-400', img: ironTokens },
              { name: 'Rum', values: '4, 3, 2, 1, 1, 1, 1, 1, 1', color: 'text-amber-500', img: rumTokens },
            ].map((g) => (
              <div key={g.name} className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                <img src={g.img} alt={g.name} className="w-8 h-8 object-contain" />
                <div>
                  <span className={`font-bold ${g.color}`}>{g.name}</span>
                  <div className="text-muted-foreground text-xs mt-0.5">{g.values}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Commission Seals */}
        <motion.section {...sectionAnim} className="game-box-card p-6">
          <h2 className="font-serif text-xl font-bold text-primary mb-2 flex items-center gap-2">
            <Award className="w-5 h-5" /> Commission Seals
          </h2>
          <p className="text-foreground/80 mb-3">
            Sell 3 or more matching goods at once to earn a bonus Commission Seal:
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { count: '3 cards', values: '1–3 bonus', img: '/Icons/RedSeal.png' },
              { count: '4 cards', values: '4–6 bonus', img: '/Icons/SilverSeal.png' },
              { count: '5+ cards', values: '8–10 bonus', img: '/Icons/GoldSeal.png' },
            ].map((b) => (
              <div key={b.count} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <img src={b.img} alt={b.count} className="w-8 h-8 object-contain" />
                <div>
                  <div className="font-bold text-primary text-sm">{b.count}</div>
                  <div className="text-xs text-muted-foreground">{b.values}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* End Conditions */}
        <motion.section {...sectionAnim} className="game-box-card p-6">
          <h2 className="font-serif text-xl font-bold text-primary mb-2 flex items-center gap-2">
            <Anchor className="w-5 h-5" /> End of Round
          </h2>
          <p className="text-foreground/80">
            The round ends when either: the <strong className="text-primary">Trading Post supply is empty</strong> (no cards left to deal),
            or <strong className="text-primary">3 token stacks are depleted</strong>. The captain with the most doubloons
            wins the round. Win the best-of series to earn your Letters of Marque!
          </p>
        </motion.section>

        {/* Optional Rules */}
        <motion.section {...sectionAnim}>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            ⚔️ Optional Rules
          </h2>
          <p className="text-foreground/70 mb-4">
            These can be toggled on in game settings for extra challenge and excitement!
          </p>
          <div className="space-y-4">
            <ActionCard
              icon={<img src="/Icons/Storm.png" alt="Storm" className="w-8 h-8 object-contain" />}
              title="Storm Rule ⛈️"
              desc="Every 3rd turn, a storm hits the Trading Post! 2 random goods are swept overboard and replaced from the Trading Post supply. Keep your strategy flexible — the market can shift without warning."
            />
            <ActionCard
              icon={<img src="/Icons/Raid.png" alt="Pirate Raid" className="w-8 h-8 object-contain" />}
              title="Pirate Raid 🏴‍☠️"
              desc="Once per game, you can launch a Pirate Raid on your opponent! Steal 1 random cargo from their Hold. Use it strategically — you only get one raid per game."
            />
            <ActionCard
              icon={<img src="/Icons/bonus.png" alt="Treasure Chest" className="w-8 h-8 object-contain" />}
              title="Treasure Chest 💰"
              desc="When enabled, each player accumulates hidden treasure tokens throughout the round. These are revealed at the end and added to your doubloon total — an exciting surprise that can swing the outcome!"
            />
          </div>
        </motion.section>

        {/* Tutorial CTA */}
        <motion.section {...sectionAnim} className="text-center py-8">
          <div className="game-box-card p-8 inline-block">
            <h2 className="font-serif text-2xl font-bold text-primary mb-3">Ready to Learn by Doing?</h2>
            <p className="text-foreground/70 mb-5 max-w-md mx-auto">
              Start the interactive tutorial to see each action demonstrated on a mock game board.
            </p>
            <Button size="lg" onClick={startTutorial} className="mr-3">
              <Anchor className="w-5 h-5 mr-2" /> Start Tutorial
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/')}>
              Back to Game
            </Button>
          </div>
        </motion.section>

        {/* Mock game board for tutorial spotlight targets */}
        <TutorialMockBoard />
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border bg-card/80">
        <p>Privateer: Letters of Marque © 2025 • QBall Creative</p>
      </footer>
    </div>
  );
};

/* Simple action card component */
const ActionCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="game-box-card p-4 flex items-start gap-4">
    <div className="flex-shrink-0 mt-1">{icon}</div>
    <div>
      <h3 className="font-serif font-bold text-primary mb-1">{title}</h3>
      <p className="text-sm text-foreground/70">{desc}</p>
    </div>
  </div>
);

/* Mock game board rendered at bottom of page — tutorial overlay highlights these elements */
const TutorialMockBoard = () => {
  const mockMarket = ['rum', 'gold', 'silks', 'ships', 'cannonballs'];
  const mockHand = ['silver', 'rum', 'gemstones', 'gold'];

  const goodsIcons: Record<string, string> = {
    rum: '/Icons/rum.png',
    gold: '/Icons/gold.png',
    silver: '/Icons/silver.png',
    silks: '/Icons/silks.png',
    cannonballs: '/Icons/cannonballs.png',
    gemstones: '/Icons/gemstones.png',
    ships: '/images/fleet.png',
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="font-serif text-2xl font-bold text-primary text-center">Tutorial Board</h2>
      <p className="text-center text-muted-foreground text-sm">
        Start the tutorial above — these areas will be highlighted step by step.
      </p>

      {/* Trading Post */}
      <div data-tutorial-id="tutorial-trading-post" className="game-box-card p-4">
        <h3 className="font-serif text-lg font-bold text-primary mb-3">Trading Post</h3>
        <div className="flex gap-3 flex-wrap" data-tutorial-id="tutorial-claim">
          {mockMarket.map((type, i) => (
            <div key={i} className="bg-muted rounded-lg p-3 text-center w-16">
              <img src={goodsIcons[type]} alt={type} className="w-10 h-10 object-contain mx-auto mb-1" />
              <span className="text-xs text-foreground/70 capitalize">{type}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3" data-tutorial-id="tutorial-commandeer">
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Commandeer Fleet: Take all ships</span>
        </div>
        <div className="flex gap-2 mt-2" data-tutorial-id="tutorial-trade">
          <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">Trade: Exchange 2+ goods</span>
        </div>
      </div>

      {/* Market Prices */}
      <div data-tutorial-id="tutorial-market-prices" className="game-box-card p-4">
        <h3 className="font-serif text-lg font-bold text-primary mb-3">Market Prices</h3>
        <div className="flex gap-4 flex-wrap">
          {['rum', 'cannonballs', 'silks', 'silver', 'gold', 'gemstones'].map((type) => (
            <div key={type} className="text-center">
              <img src={goodsIcons[type]} alt={type} className="w-8 h-8 object-contain mx-auto mb-1" />
              <div className="text-xs text-muted-foreground capitalize">{type}</div>
              <div className="text-sm font-bold text-primary">●●●</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ship's Hold */}
      <div data-tutorial-id="tutorial-ships-hold" className="game-box-card p-4">
        <h3 className="font-serif text-lg font-bold text-primary mb-3">Your Ship's Hold</h3>
        <div className="flex gap-3 flex-wrap">
          {mockHand.map((type, i) => (
            <div key={i} className="bg-muted rounded-lg p-3 text-center w-16">
              <img src={goodsIcons[type]} alt={type} className="w-10 h-10 object-contain mx-auto mb-1" />
              <span className="text-xs text-foreground/70 capitalize">{type}</span>
            </div>
          ))}
          {[...Array(3)].map((_, i) => (
            <div key={`empty-${i}`} className="bg-muted/30 border border-dashed border-border rounded-lg p-3 w-16 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Empty</span>
            </div>
          ))}
        </div>
        <div className="mt-3" data-tutorial-id="tutorial-sell">
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Sell: 2+ matching goods for doubloons</span>
        </div>
      </div>

      {/* Bonus section */}
      <div data-tutorial-id="tutorial-bonus" className="game-box-card p-4">
        <h3 className="font-serif text-lg font-bold text-primary mb-3">Commission Seals</h3>
        <div className="flex gap-3">
          {[
            { label: '3-card', img: '/Icons/RedSeal.png' },
            { label: '4-card', img: '/Icons/SilverSeal.png' },
            { label: '5-card', img: '/Icons/GoldSeal.png' },
          ].map((b) => (
            <div key={b.label} className="text-center">
              <img src={b.img} alt={b.label} className="w-10 h-10 object-contain mx-auto" />
              <span className="text-xs text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional rules targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div data-tutorial-id="tutorial-storm" className="game-box-card p-4 text-center">
          <img src="/Icons/Storm.png" alt="Storm" className="w-10 h-10 object-contain mx-auto mb-2" />
          <span className="text-sm font-bold text-primary">Storm Rule</span>
        </div>
        <div data-tutorial-id="tutorial-raid" className="game-box-card p-4 text-center">
          <img src="/Icons/Raid.png" alt="Raid" className="w-10 h-10 object-contain mx-auto mb-2" />
          <span className="text-sm font-bold text-primary">Pirate Raid</span>
        </div>
        <div data-tutorial-id="tutorial-treasure" className="game-box-card p-4 text-center">
          <img src="/Icons/bonus.png" alt="Treasure" className="w-10 h-10 object-contain mx-auto mb-2" />
          <span className="text-sm font-bold text-primary">Treasure Chest</span>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;
