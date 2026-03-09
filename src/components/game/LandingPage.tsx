import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore, VoyageRecord } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useConsentStore } from '@/store/consentStore';
import { useRemoteConfigStore } from '@/store/remoteConfigStore';
import { Difficulty } from '@/types/game';
import { SettingsPanel } from './SettingsPanel';
import { MultiplayerLobby } from './MultiplayerLobby';
import { AgeConsentModal } from './AgeConsentModal';
import { AdBanner } from './AdBanner';
import { RemoveAdsButton } from './RemoveAdsButton';
import { InstallPrompt } from './InstallPrompt';
import { HeroSection } from './HeroSection';
import { SetSailPanel } from './SetSailPanel';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const HowToPlunder = lazy(() => import('./HowToPlunder').then(m => ({ default: m.HowToPlunder })));
const VictoryConditions = lazy(() => import('./VictoryConditions').then(m => ({ default: m.VictoryConditions })));

// Preload game board images while user is on landing page
import { preloadImages } from '@/lib/preloadImages';
preloadImages();

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Deckhand',
  medium: 'Bosun',
  hard: 'Privateer',
  expert: 'Admiral',
};

const RecentVoyages = ({ voyages }: { voyages: VoyageRecord[] }) => {
  const [open, setOpen] = useState(false);
  if (voyages.length === 0) return null;

  return (
    <div className="max-w-lg mx-auto px-4 mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-card/80 border border-border text-sm hover:bg-card transition-colors"
      >
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          <span className="font-pirate text-primary">Recent Voyages</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-border bg-card/60 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1.5 px-3 text-left font-medium">Result</th>
                <th className="py-1.5 px-3 text-left font-medium">Difficulty</th>
                <th className="py-1.5 px-3 text-center font-medium">Score</th>
                <th className="py-1.5 px-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {voyages.map((v, i) => (
                <tr key={i} className={cn("border-b border-border/50 last:border-0", v.won ? "bg-primary/5" : "bg-destructive/5")}>
                  <td className="py-1.5 px-3">
                    <Badge variant={v.won ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                      {v.won ? 'Victory' : 'Defeat'}
                    </Badge>
                  </td>
                  <td className="py-1.5 px-3 text-foreground">{DIFFICULTY_LABELS[v.difficulty]}</td>
                  <td className="py-1.5 px-3 text-center text-foreground">{v.playerScore} – {v.opponentScore}</td>
                  <td className="py-1.5 px-3 text-right text-muted-foreground">
                    {new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const LandingPage = () => {
  const {
    playerName: savedPlayerName,
    lastDifficulty,
    recentVoyages,
    setPlayerName: savePlayerName,
    setLastDifficulty,
  } = usePlayerStore();

  const { optionalRules } = useSettingsStore();
  const { hasConsented, restrictedMode } = useConsentStore();
  const { config: remoteConfig } = useRemoteConfigStore();

  const [playerName, setPlayerName] = useState(savedPlayerName || 'Captain');
  const [difficulty, setDifficulty] = useState<Difficulty>(
    restrictedMode ? 'easy' : (lastDifficulty || remoteConfig.defaultAIDifficulty)
  );
  const [mode, setMode] = useState<'aai' | 'multiplayer'>('aai');
  const [bestOf, setBestOf] = useState<1 | 3>(1);
  const [firstPlayer, setFirstPlayer] = useState<'host' | 'random'>('host');
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [starting, setStarting] = useState(false);

  const { startGame } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    setDifficulty(lastDifficulty);
  }, [lastDifficulty]);

  const handleDifficultyChange = (level: Difficulty) => {
    if (restrictedMode && level !== 'easy') return;
    setDifficulty(level);
    setLastDifficulty(level);
  };

  const handleStart = () => {
    setStarting(true);
    const name = playerName.trim() || 'Captain';
    savePlayerName(name);
    const rules = restrictedMode
      ? { stormRule: false, pirateRaid: false, treasureChest: false }
      : optionalRules;
    startGame(name, restrictedMode ? 'easy' : difficulty, rules, bestOf === 1 ? 1 : 3, firstPlayer);
  };

  const handleCreateRoom = () => setShowMultiplayer(true);
  const handleJoinRoom = () => setShowMultiplayer(true);

  return (
    <div className="min-h-screen flex flex-col relative">
      {!hasConsented && <AgeConsentModal />}
      {/* <InstallPrompt /> */}

      {/* Settings — top right */}
      <div className="absolute top-4 right-4 z-20">
        <SettingsPanel />
      </div>

      {/* Hero */}
      <HeroSection />

      {/* Set Sail Panel */}
      <AnimatePresence mode="wait">
        {showMultiplayer ? (
          <div className="max-w-lg mx-auto px-4 py-8">
            <MultiplayerLobby
              key="multiplayer"
              playerName={playerName}
              onBack={() => setShowMultiplayer(false)}
              onNameChange={() => {}}
            />
          </div>
        ) : (
          <SetSailPanel
            key="setup"
            playerName={playerName}
            onNameChange={(name) => { setPlayerName(name); savePlayerName(name); }}
            stats={usePlayerStore.getState().stats}
            mode={mode}
            setMode={setMode}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            bestOf={bestOf}
            setBestOf={setBestOf}
            firstPlayer={firstPlayer}
            setFirstPlayer={setFirstPlayer}
            onStartAAI={handleStart}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            restrictedMode={restrictedMode}
            loading={starting}
          />
        )}
      </AnimatePresence>

      {/* Recent Voyages */}
      {!showMultiplayer && <RecentVoyages voyages={recentVoyages} />}

      {/* Educational sections */}
      {!showMultiplayer && (
        <Suspense fallback={null}>
          <HowToPlunder />
          <VictoryConditions />
        </Suspense>
      )}

      {/* Ad Banner */}
      <div className="relative px-4 py-3 max-w-4xl mx-auto w-full">
        <AdBanner />
      </div>

      {/* Footer */}
      <footer className="relative py-6 px-4 text-center text-sm text-muted-foreground border-t border-border bg-card/80">
        <p>Privateer: Letters of Marque © 2026 • QBall Creative</p>
      </footer>
    </div>
  );
};
