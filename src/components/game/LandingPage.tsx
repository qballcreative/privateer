import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useConsentStore } from '@/store/consentStore';
import { useRemoteConfigStore } from '@/store/remoteConfigStore';
import { Difficulty } from '@/types/game';
import { SettingsPanel } from './SettingsPanel';
import { MultiplayerLobby } from './MultiplayerLobby';
import { AgeConsentModal } from './AgeConsentModal';
import { AdBanner } from './AdBanner';
import { InstallPrompt } from './InstallPrompt';
import { HeroSection } from './HeroSection';
import { SetSailPanel } from './SetSailPanel';

const HowToPlunder = lazy(() => import('./HowToPlunder').then(m => ({ default: m.HowToPlunder })));
const VictoryConditions = lazy(() => import('./VictoryConditions').then(m => ({ default: m.VictoryConditions })));

export const LandingPage = () => {
  const {
    playerName: savedPlayerName,
    lastDifficulty,
    setPlayerName: savePlayerName,
    setLastDifficulty,
  } = usePlayerStore();

  const { optionalRules } = useSettingsStore();
  const { hasConsented, restrictedMode } = useConsentStore();
  const { config: remoteConfig } = useRemoteConfigStore();

  const [playerName] = useState(savedPlayerName || 'Captain');
  const [difficulty, setDifficulty] = useState<Difficulty>(
    restrictedMode ? 'easy' : (lastDifficulty || remoteConfig.defaultAIDifficulty)
  );
  const [mode, setMode] = useState<'aai' | 'multiplayer'>('aai');
  const [bestOf, setBestOf] = useState<1 | 3>(1);
  const [firstPlayer, setFirstPlayer] = useState<'host' | 'random'>('host');
  const [showMultiplayer, setShowMultiplayer] = useState(false);

  const { startGame } = useGameStore();

  useEffect(() => {
    setDifficulty(lastDifficulty);
  }, [lastDifficulty]);

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

  const handleCreateRoom = () => setShowMultiplayer(true);
  const handleJoinRoom = () => setShowMultiplayer(true);

  if (!hasConsented) {
    return <AgeConsentModal />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <InstallPrompt />

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
          />
        )}
      </AnimatePresence>

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
        <p>Privateer: Letters of Marque © 2025 • QBall Creative</p>
      </footer>
    </div>
  );
};
