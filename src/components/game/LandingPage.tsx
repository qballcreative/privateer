import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useConsentStore } from '@/store/consentStore';
import { Difficulty } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import heroBg from '@/assets/hero-bg.jpg';
import logoImage from '@/assets/Logo.png';
import { Anchor, Swords, Users, Ship, Gem, Coins, Wine, CircleDot, Shirt, Trophy, Skull, RotateCcw, Info } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { MultiplayerLobby } from './MultiplayerLobby';
import { AgeConsentModal } from './AgeConsentModal';
import { AdBanner } from './AdBanner';

const difficultyConfig: Record<Difficulty, {
  label: string;
  description: string;
  color: string;
}> = {
  easy: {
    label: 'Cabin Boy',
    description: 'Perfect for landlubbers',
    color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
  },
  medium: {
    label: 'First Mate',
    description: 'A worthy challenge',
    color: 'text-primary border-primary/30 bg-primary/10'
  },
  hard: {
    label: 'Dread Pirate',
    description: 'Only for sea dogs',
    color: 'text-destructive border-destructive/30 bg-destructive/10'
  },
  expert: {
    label: 'Pirate Lord',
    description: 'Perfect play, no mercy',
    color: 'text-purple-400 border-purple-400/30 bg-purple-400/10'
  }
};

const goods = [{
  icon: Wine,
  label: 'Rum',
  color: 'text-amber-500'
}, {
  icon: CircleDot,
  label: 'Cannonballs',
  color: 'text-slate-400'
}, {
  icon: Shirt,
  label: 'Silks',
  color: 'text-purple-400'
}, {
  icon: Coins,
  label: 'Silver',
  color: 'text-gray-300'
}, {
  icon: Coins,
  label: 'Gold',
  color: 'text-yellow-400'
}, {
  icon: Gem,
  label: 'Gemstones',
  color: 'text-emerald-400'
}];
export const LandingPage = () => {
  const {
    playerName: savedPlayerName,
    lastDifficulty,
    stats,
    setPlayerName: savePlayerName,
    setLastDifficulty,
    resetStats
  } = usePlayerStore();
  
  const { optionalRules } = useSettingsStore();
  const { hasConsented, restrictedMode } = useConsentStore();
  
  const [playerName, setPlayerName] = useState(savedPlayerName);
  const [difficulty, setDifficulty] = useState<Difficulty>(restrictedMode ? 'easy' : lastDifficulty);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const {
    startGame
  } = useGameStore();

  // Sync local state with stored preferences on mount
  useEffect(() => {
    setPlayerName(savedPlayerName);
    setDifficulty(lastDifficulty);
  }, [savedPlayerName, lastDifficulty]);

  const handleDifficultyChange = (level: Difficulty) => {
    if (restrictedMode && level !== 'easy') return;
    setDifficulty(level);
    setLastDifficulty(level);
  };
  
  const handleStart = () => {
    const name = playerName.trim() || 'Captain';
    savePlayerName(name);
    const rules = restrictedMode
      ? { stormRule: false, pirateRaid: false, treasureChest: false }
      : optionalRules;
    startGame(name, restrictedMode ? 'easy' : difficulty, rules);
  };
  // Show age consent modal before anything else
  if (!hasConsented) {
    return <AgeConsentModal />;
  }

  // In restricted mode, force optional rules off for this session
  const effectiveRules = restrictedMode
    ? { stormRule: false, pirateRaid: false, treasureChest: false }
    : optionalRules;

  return <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroBg})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      </div>

      {/* Settings Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <SettingsPanel />
      </div>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center p-4">

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Logo */}
          <motion.div initial={{
          opacity: 0,
          y: -30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div animate={{
              rotate: [0, -10, 10, 0]
            }} transition={{
              duration: 4,
              repeat: Infinity
            }}>
                <img src={logoImage} alt="Privateer Logo" className="w-16 h-16 lg:w-24 lg:h-24 drop-shadow-lg object-contain" />
              </motion.div>
            </div>
            
            <h1 className="font-pirate text-6xl lg:text-8xl text-primary mb-2 drop-shadow-[0_0_30px_hsl(var(--gold)/0.5)]">
              Privateer
            </h1>
            <p className="text-lg lg:text-xl text-primary/80 font-pirate tracking-wide">
              Letters of Marque
            </p>
            <p className="text-base text-foreground/60 font-serif mt-1">
              A Trading Duel
            </p>
          </motion.div>

          {/* Goods showcase */}
          <motion.div className="flex items-center justify-center gap-4 lg:gap-6 my-8 flex-wrap" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3
        }}>
            {goods.map((good, i) => <motion.div key={good.label} initial={{
            opacity: 0,
            scale: 0
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.4 + i * 0.1
          }} className="flex flex-col items-center p-2 rounded-lg bg-card/30 backdrop-blur-sm">
                <good.icon className={cn('w-8 h-8 lg:w-10 lg:h-10', good.color)} />
                <span className="text-xs text-foreground/70 mt-1">{good.label}</span>
              </motion.div>)}
          </motion.div>

          {/* Game setup or Multiplayer Lobby */}
          <AnimatePresence mode="wait">
            {showMultiplayer ? <MultiplayerLobby key="multiplayer" playerName={playerName || 'Captain'} onBack={() => setShowMultiplayer(false)} onNameChange={name => setPlayerName(name)} /> : <motion.div key="setup" className="bg-card/90 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-primary/30 shadow-2xl max-w-md mx-auto" initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -30
          }} transition={{
            delay: 0.5
          }}>
                <h2 className="font-pirate text-2xl lg:text-3xl text-primary mb-6">Set Sail</h2>

                {/* Name input */}
                <div className="mb-6">
                  <label className="block text-sm text-muted-foreground mb-2 text-left">Your Pirate Name</label>
                  <Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Captain..." className="bg-muted/50 border-primary/30 focus:border-primary text-center text-lg" onKeyDown={e => e.key === 'Enter' && handleStart()} />
                </div>

                {/* Difficulty selection */}
                <div className="mb-6">
                  <label className="block text-sm text-muted-foreground mb-3 text-left">Difficulty</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(difficultyConfig) as Difficulty[]).map(level => {
                  const config = difficultyConfig[level];
                  const locked = restrictedMode && level !== 'easy';
                  return <button key={level} onClick={() => handleDifficultyChange(level)} disabled={locked} className={cn('p-3 rounded-lg border-2 transition-all duration-200', locked && 'opacity-40 cursor-not-allowed', difficulty === level ? config.color : 'border-border hover:border-primary/30 bg-muted/30')}>
                          <p className="font-bold text-sm">{config.label}</p>
                          <p className="text-xs text-muted-foreground mt-1 hidden lg:block">{config.description}</p>
                        </button>;
                })}
                  </div>
                </div>

                {/* Player Stats */}
                {stats.gamesPlayed > 0 && <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm text-muted-foreground">Your Stats</label>
                      {!showResetConfirm ? <button onClick={() => setShowResetConfirm(true)} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button> : <div className="flex items-center gap-2">
                          <button onClick={() => {
                    resetStats();
                    setShowResetConfirm(false);
                  }} className="text-xs text-destructive hover:text-destructive/80 transition-colors">
                            Confirm
                          </button>
                          <button onClick={() => setShowResetConfirm(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                          </button>
                        </div>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{stats.gamesPlayed}</p>
                        <p className="text-xs text-muted-foreground">Played</p>
                      </div>
                      <div className="p-2 rounded bg-emerald-500/10">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <p className="text-lg font-bold text-emerald-400">{stats.wins}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Wins</p>
                      </div>
                      <div className="p-2 rounded bg-destructive/10">
                        <div className="flex items-center justify-center gap-1">
                          <Skull className="w-4 h-4 text-destructive" />
                          <p className="text-lg font-bold text-destructive">{stats.losses}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Losses</p>
                      </div>
                    </div>
                  </div>}

                {/* Restricted Mode Notice */}
                {restrictedMode && (
                  <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A simplified version is available for younger players. Full gameplay, multiplayer, advanced rules, and ad‑supported features are available for players 13+.
                    </p>
                  </div>
                )}

                {/* Start buttons */}
                <div className="space-y-3">
                  <Button onClick={handleStart} variant="gold" size="xl" className="w-full font-pirate">
                    <Swords className="w-6 h-6 mr-2" />
                    Battle the AI
                  </Button>
                  
                  {!restrictedMode && (
                    <Button variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/10" onClick={() => setShowMultiplayer(true)}>
                      <Users className="w-5 h-5 mr-2" />
                      Multiplayer (Host / Join)     
                    </Button>
                  )}
                </div>
              </motion.div>}
          </AnimatePresence>

          {/* Rules preview */}
          {!showMultiplayer && <motion.div className="mt-8 text-sm text-foreground/60" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.8
        }}>
              <p className="mb-2 text-lg">Sail the Seas</p>
              <p>Claim cargo • Load your hold • Unload for doubloons • Become the richest captain!</p>
            </motion.div>}
        </div>
      </section>

      {/* How to play section */}
      {!showMultiplayer && <section className="relative py-12 px-4 bg-card/80 backdrop-blur-sm border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-pirate text-3xl text-primary text-center mb-8">How to Play</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{
            icon: <Ship className="w-10 h-10" />,
            title: 'Claim Cargo',
            description: 'Claim cargo from the Trading Post or commandeer all ships at once to grow your fleet.'
          }, {
            icon: <Swords className="w-10 h-10" />,
            title: 'Trade Goods',
            description: 'Swap 2+ goods between your hold and the Trading Post. Ships work as wildcards!'
          }, {
            icon: <Coins className="w-10 h-10" />,
            title: 'Unload Cargo',
            description: 'Unload matching cargo for doubloons. Larger shipments earn bonus commissions!'
          }].map((item, i) => <motion.div key={item.title} className="p-6 rounded-xl bg-muted/50 border border-border text-center hover:border-primary/30 transition-colors" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.9 + i * 0.1
          }} whileHover={{
            scale: 1.02
          }}>
                  <div className="text-primary mb-4 flex justify-center">{item.icon}</div>
                  <h3 className="font-pirate text-xl text-primary mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>)}
            </div>

            {/* Win condition */}
            <motion.div className="mt-8 p-6 rounded-xl bg-primary/10 border border-primary/20 text-center" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 1.2
        }}>
              <h3 className="font-pirate text-xl text-primary mb-2">Victory Condition</h3>
              <p className="text-foreground/80">
                Win 2 out of 3 voyages. Each voyage ends when the supply ship empties or 3 cargo stacks are depleted.
                <br />
                The captain with the most doubloons wins the voyage!
              </p>
            </motion.div>
          </div>
        </section>}

      {/* Footer */}
      <footer className="relative py-6 px-4 text-center text-sm text-muted-foreground border-t border-border bg-card/50">
        <p>Privateer: Letters of Marque © 2025 • QBall Creative</p>
      </footer>
    </div>;
};