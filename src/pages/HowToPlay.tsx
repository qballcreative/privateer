import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Anchor } from 'lucide-react';
import bannerLogo from '@/assets/BannerLogo.png';

// Token images
import rumTokens from '@/assets/tokens/rum.png';
import ironTokens from '@/assets/tokens/iron.png';
import silverTokens from '@/assets/tokens/silver.png';
import silkTokens from '@/assets/tokens/silk.png';
import goldTokens from '@/assets/tokens/gold.png';
import gemTokens from '@/assets/tokens/gems.png';
import shipTokens from '@/assets/tokens/ship.png';

const sectionAnim = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
};

const HowToPlay = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">

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
          <img src={bannerLogo} alt="Privateer: Letters of Marque" className="h-16 md:h-20 object-contain mx-auto mb-4" />
          <p className="text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            A fast-paced trading duel on the high seas! Buy, sell, and trade cargo to
            earn the most doubloons. Outsmart your opponent to earn your Letters of Marque
            and become the most feared privateer on the seven seas.
          </p>
        </motion.section>

        {/* Game Setup */}
        <motion.section {...sectionAnim}>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">
            Game Setup
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
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">
            Your Turn — Actions Available
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
              desc="Sell 2+ matching goods from your Hold to earn doubloon tokens. For premium goods (gold, silver, gems), you must sell at least 2. Sell 3, 4, or 5+ to earn bonus Commission Seals!"
            />
          </div>
        </motion.section>

        {/* Hand Limit */}
        <motion.section {...sectionAnim} className="game-box-card p-6">
          <h2 className="font-serif text-xl font-bold text-primary mb-2">
            Hand Limit
          </h2>
          <p className="text-foreground/80">
            Your Ship's Hold can carry at most <strong className="text-primary">7 goods</strong>.
            Ships are stored separately and don't count. If your Hold is full, you'll need to sell
            or trade before claiming more cargo.
          </p>
        </motion.section>

        {/* Scoring */}
        <motion.section {...sectionAnim} className="game-box-card p-6">
          <h2 className="font-serif text-xl font-bold text-primary mb-2">
            Scoring
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
            Optional Rules
          </h2>
          <p className="text-foreground/70 mb-4">
            These can be toggled on in game settings for extra challenge and excitement!
          </p>
          <div className="space-y-4">
            <ActionCard
              icon={<img src="/Icons/Storm.png" alt="Storm" className="w-8 h-8 object-contain" />}
              title="Storm Rule"
              desc="Every 3rd turn, a storm hits the Trading Post! 2 random goods are swept overboard and replaced from the Trading Post supply. Keep your strategy flexible — the market can shift without warning."
            />
            <ActionCard
              icon={<img src="/Icons/Raid.png" alt="Pirate Raid" className="w-8 h-8 object-contain" />}
              title="Pirate Raid"
              desc="Once per game, you can launch a Pirate Raid on your opponent! Steal 1 random cargo from their Hold. Use it strategically — you only get one raid per game."
            />
            <ActionCard
              icon={<img src="/Icons/bonus.png" alt="Treasure Chest" className="w-8 h-8 object-contain" />}
              title="Treasure Chest"
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
            <Button size="lg" onClick={() => navigate('/tutorial')} className="mr-3">
              <Anchor className="w-5 h-5 mr-2" /> Start Tutorial
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/')}>
              Back to Game
            </Button>
          </div>
        </motion.section>
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

export default HowToPlay;
