import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, calculateScore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePlayerStore } from '@/store/playerStore';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { ActionNotification } from './ActionNotification';
import { InterstitialAd } from './InterstitialAd';
import { SettingsPanel } from './SettingsPanel';
import { ConnectionIndicator } from './ConnectionIndicator';
import { TurnBanner } from './TurnBanner';
import { VictoryScreen } from './VictoryScreen';
import { DisconnectModal } from './DisconnectModal';
import { RoundEndModal } from './RoundEndModal';
import { MultiplayerChat } from './MultiplayerChat';
import { Tutorial } from './Tutorial';
import { useTutorialStore } from '@/store/tutorialStore';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card } from '@/types/game';
import { Home, Swords, CloudLightning, Crosshair, Gift, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import bannerLogo from '@/assets/BannerLogo.png';
import { toast } from '@/components/ui/sonner';
import { PhoneLayout, TabletLayout, DesktopLayout } from './layouts';

import { preloadImages } from '@/lib/preloadImages';
preloadImages();

export const GameBoard = () => {
  const [ready, setReady] = useState(false);
  const { 
    players, currentPlayerIndex, tokenStacks, bonusTokens,
    phase, lastAction, nextRound, resetGame, restartGame, claimVictory,
    getRoundWinner, getWinner, round, optionalRules, turnCount,
    canUsePirateRaid, pirateRaid, hiddenTreasures,
    isMultiplayer, applyGameState, getSerializableState, deck,
  } = useGameStore();

  const { actionNotificationDuration, musicEnabled, hasSeenMusicHint, setHasSeenMusicHint } = useSettingsStore();
  const { recordGameResult } = usePlayerStore();
  const { playActionSound, playSound, playMusic, stopMusic } = useGameAudio();
  const { sendMessage, opponentName, isHost, hostId, peerId, latency, state: multiplayerState, onMessage: registerMessageHandler, reset: resetMultiplayer, reconnect, sendForfeit } = useMultiplayerStore();
  const isMobile = useIsMobile();
  const { hasSeenTutorial, start: startTutorial, isActive: isTutorialActive } = useTutorialStore();

  const [isRaidMode, setIsRaidMode] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [prevPhase, setPrevPhase] = useState<typeof phase | null>(null);
  const [treasureDrawerOpen, setTreasureDrawerOpen] = useState(false);
  const [opponentDrawerOpen, setOpponentDrawerOpen] = useState(false);
  const [tradingPostCollapsed, setTradingPostCollapsed] = useState(false);
  const [isExchangeMode, setIsExchangeMode] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const prevPlayerIndexRef = useRef(currentPlayerIndex);
  const [shakeKey, setShakeKey] = useState(0);
  const isDeckLow = phase === 'playing' && deck.length <= 10;
  const creakRef = useRef<HTMLAudioElement | null>(null);
  const [roundFlourish, setRoundFlourish] = useState(false);
  const [opponentForfeited, setOpponentForfeited] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const localPlayerIndex = isMultiplayer ? 0 : players.findIndex((p) => !p.isAI);
  const opponentIndex = isMultiplayer ? 1 : players.findIndex((p) => p.isAI);
  const localPlayer = players[localPlayerIndex >= 0 ? localPlayerIndex : 0];
  const opponentPlayer = opponentIndex >= 0 ? players[opponentIndex] : players[1];
  const humanPlayer = localPlayer;

  // ─── Effects ───

  useEffect(() => {
    if (phase === 'playing') {
      playMusic();
      if (!musicEnabled && !hasSeenMusicHint) {
        toast('🎵 Background music is available — enable it in Settings.');
        setHasSeenMusicHint(true);
      }
    } else if (phase === 'lobby') {
      stopMusic();
    }
  }, [phase, playMusic, stopMusic]);

  useEffect(() => {
    if (prevPhase !== phase) {
      if (phase === 'playing' && (prevPhase === null || prevPhase === 'lobby' || prevPhase === 'roundEnd')) {
        playSound('new-round');
      } else if (phase === 'roundEnd') {
        const winner = getRoundWinner();
        if (winner && !winner.isAI) playSound('round-win');
        else if (winner) playSound('round-lose');
      } else if (phase === 'gameEnd') {
        const winner = getWinner();
        if (winner && !winner.isAI) playSound('game-win');
        else if (winner) playSound('game-lose');
      }
      setPrevPhase(phase);
    }
  }, [phase, prevPhase, getRoundWinner, getWinner, playSound]);

  useEffect(() => {
    if (phase === 'gameEnd' && prevPhase !== 'gameEnd' && !isMultiplayer) {
      const winner = getWinner();
      if (winner) {
        const playerWon = !winner.isAI;
        const pScore = calculateScore(humanPlayer, players);
        const oScore = calculateScore(opponentPlayer, players);
        const { lastDifficulty } = usePlayerStore.getState();
        recordGameResult(playerWon, {
          date: new Date().toISOString(),
          difficulty: lastDifficulty,
          playerScore: pScore,
          opponentScore: oScore,
        });
      }
    }
  }, [phase, prevPhase, isMultiplayer, getWinner, recordGameResult]);

  useEffect(() => {
    if (lastAction) {
      setShowAction(true);
      playActionSound(lastAction.type);
      const timer = setTimeout(() => setShowAction(false), actionNotificationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, actionNotificationDuration, playActionSound]);

  useEffect(() => {
    if (phase === 'playing' && currentPlayerIndex === localPlayerIndex && prevPlayerIndexRef.current !== localPlayerIndex) {
      setShowTurnBanner(true);
      const timer = setTimeout(() => setShowTurnBanner(false), 900);
      return () => clearTimeout(timer);
    }
    prevPlayerIndexRef.current = currentPlayerIndex;
  }, [currentPlayerIndex, phase, localPlayerIndex]);

  useEffect(() => {
    const updateCreak = () => {
      const { soundEnabled, soundVolume } = useSettingsStore.getState();
      if (isDeckLow && soundEnabled) {
        if (!creakRef.current) {
          const creak = new Audio('/sounds/sea_sounds.wav');
          creak.loop = true;
          creakRef.current = creak;
        }
        creakRef.current.volume = 0.15 * soundVolume;
        creakRef.current.play().catch(() => {});
      } else {
        if (creakRef.current) { creakRef.current.pause(); creakRef.current.currentTime = 0; }
      }
    };
    updateCreak();
    const unsub = useSettingsStore.subscribe(updateCreak);
    return () => { unsub(); if (creakRef.current && !isDeckLow) creakRef.current.pause(); };
  }, [isDeckLow]);

  useEffect(() => {
    if (phase === 'roundEnd' && prevPhase === 'playing') {
      setRoundFlourish(true);
      const timer = setTimeout(() => setRoundFlourish(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, prevPhase]);

  const triggerInvalidAction = useCallback(() => {
    setShakeKey(prev => prev + 1);
    playSound('error');
  }, [playSound]);

  const hasStartedTutorialRef = useRef(false);
  useEffect(() => {
    if (!hasSeenTutorial && !isTutorialActive && !hasStartedTutorialRef.current && phase === 'playing') {
      hasStartedTutorialRef.current = true;
      const timer = setTimeout(() => startTutorial(), 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial, isTutorialActive, phase, startTutorial]);

  const prevMultiplayerStateRef = useRef(multiplayerState);
  useEffect(() => {
    const wasDisconnected = prevMultiplayerStateRef.current === 'disconnected' || prevMultiplayerStateRef.current === 'hosting';
    const nowConnected = multiplayerState === 'connected';
    if (isMultiplayer && isHost && phase === 'playing' && wasDisconnected && nowConnected) {
      sendMessage({ type: 'rejoin-sync', payload: { gameState: getSerializableState() } });
    }
    prevMultiplayerStateRef.current = multiplayerState;
  }, [isMultiplayer, isHost, phase, multiplayerState, sendMessage, getSerializableState]);

  useEffect(() => {
    if (isMultiplayer && (phase === 'playing' || phase === 'roundEnd')) {
      const unsubscribe = registerMessageHandler((message) => {
        if (message.type === 'game-state') applyGameState((message.payload as any).gameState, true);
        else if (message.type === 'next-round') nextRound();
      });
      return unsubscribe;
    }
  }, [isMultiplayer, phase, applyGameState, registerMessageHandler, nextRound]);

  const prevLastActionRef = useRef(lastAction);
  useEffect(() => {
    if (isMultiplayer && phase === 'playing' && lastAction && lastAction !== prevLastActionRef.current) {
      if (currentPlayerIndex !== localPlayerIndex) {
        sendMessage({ type: 'game-state', payload: { gameState: getSerializableState() } });
      }
      prevLastActionRef.current = lastAction;
    }
  }, [isMultiplayer, phase, lastAction, currentPlayerIndex, sendMessage, getSerializableState]);

  const handlePirateRaid = useCallback((card: Card) => {
    pirateRaid(card.id);
    setIsRaidMode(false);
  }, [pirateRaid]);

  const activeRulesCount = Object.values(optionalRules).filter(Boolean).length;
  const isOpponentPondering = currentPlayerIndex === opponentIndex && phase === 'playing';

  const treasureSupplyProps = useMemo(() => ({
    tokenStacks, bonusTokens, optionalRules, currentPlayerIndex, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid,
  }), [tokenStacks, bonusTokens, optionalRules, currentPlayerIndex, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid]);

  const opponentPanelProps = useMemo(() => ({
    opponentPlayer, currentPlayerIndex, isRaidMode, onRaidCard: handlePirateRaid, isPondering: isOpponentPondering,
  }), [opponentPlayer, currentPlayerIndex, isRaidMode, isOpponentPondering, handlePirateRaid]);

  const layoutProps = useMemo(() => ({
    treasureSupplyProps, opponentPanelProps, isRaidMode, setIsRaidMode,
    isExchangeMode, setIsExchangeMode, triggerInvalidAction,
    humanPlayer, opponentPlayer, currentPlayerIndex, localPlayerIndex, opponentIndex,
    phase, isOpponentPondering, deck, tokenStacks, turnCount, optionalRules,
    treasureDrawerOpen, setTreasureDrawerOpen,
    opponentDrawerOpen, setOpponentDrawerOpen,
    tradingPostCollapsed, setTradingPostCollapsed,
    handlePirateRaid, players,
  }), [treasureSupplyProps, opponentPanelProps, isRaidMode, isExchangeMode, triggerInvalidAction,
    humanPlayer, opponentPlayer, currentPlayerIndex, localPlayerIndex, opponentIndex,
    phase, isOpponentPondering, deck, tokenStacks, turnCount, optionalRules,
    treasureDrawerOpen, opponentDrawerOpen, tradingPostCollapsed, handlePirateRaid, players]);

  return (
    <motion.div
      className="min-h-screen p-2 sm:p-4 lg:p-6 relative"
      style={{
        backgroundImage: 'url(/images/wood-bg.png)',
        backgroundSize: '100% auto',
        backgroundRepeat: 'repeat-y',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
      }}
      animate={roundFlourish ? { scale: [1, 1.008, 0.998, 1] } : { scale: 1 }}
      transition={roundFlourish ? { duration: 1.2, ease: 'easeInOut' } : undefined}
      ref={(el) => { if (el && !ready) requestAnimationFrame(() => setReady(true)); }}
    >
      <AnimatePresence>
        {isDeckLow && (
          <motion.div className="deck-low-vignette" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
        )}
      </AnimatePresence>

      <Tutorial />
      <TurnBanner show={showTurnBanner} />
      <ActionNotification action={lastAction} show={showAction} />
      <InterstitialAd trigger={phase === 'roundEnd'} round={round} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-3 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={bannerLogo} alt="Privateer: Letters of Marque" className="h-28 sm:h-36 lg:h-40 object-contain" />
            {activeRulesCount > 0 && (
              <div className="flex items-center gap-1">
                {optionalRules.stormRule && (
                  <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30" title="Storm Rule Active">
                    <CloudLightning className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  </div>
                )}
                {optionalRules.pirateRaid && (
                  <div className="p-1 sm:p-1.5 rounded-lg bg-red-500/20 border border-red-500/30" title="Pirate Raid Active">
                    <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                  </div>
                )}
                {optionalRules.treasureChest && (
                  <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30" title="Treasure Chest Active">
                    <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {isMultiplayer && phase === 'playing' && <ConnectionIndicator className="hidden sm:flex" />}
            {optionalRules.stormRule && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CloudLightning className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">{3 - (turnCount % 3)} turn{3 - (turnCount % 3) !== 1 ? 's' : ''} to storm</span>
              </div>
            )}
            {lastAction && (
              <motion.span key={lastAction.description} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="text-sm text-muted-foreground px-3 py-1 bg-card rounded-full border border-border hidden lg:block">
                {lastAction.playerName} {lastAction.description}
              </motion.span>
            )}
            <SettingsPanel />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-pirate text-primary">Abandon Voyage?</AlertDialogTitle>
                  <AlertDialogDescription>Your current game progress will be lost. Are you sure you want to return to port?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Playing</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { if (!isMultiplayer && phase === 'playing') recordGameResult(false); resetGame(); }} className="bg-destructive hover:bg-destructive/90">
                    Return to Port
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {/* Layouts — deferred until ready so card entry animations play visibly */}
        {ready && (
          <>
            <PhoneLayout {...layoutProps} />
            <TabletLayout {...layoutProps} />
            <DesktopLayout {...layoutProps} />
          </>
        )}

        {/* Turn indicator overlay */}
        <AnimatePresence>
          {currentPlayerIndex !== localPlayerIndex && phase === 'playing' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-card/95 border border-primary/30 shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    {isMultiplayer ? <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> : <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />}
                  </motion.div>
                  <span className="font-pirate text-lg sm:text-xl text-primary">
                    {`${opponentPlayer?.name || opponentName || 'The Captain'} is pondering their next move…`}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MultiplayerChat isMultiplayer={isMultiplayer} phase={phase} localPlayerName={localPlayer?.name || 'Player'}
          sendMessage={sendMessage} registerMessageHandler={registerMessageHandler} playSound={playSound} />

        <DisconnectModal isMultiplayer={isMultiplayer} multiplayerState={multiplayerState} phase={phase}
          isHost={isHost} peerId={peerId} hostId={hostId} localPlayerName={localPlayer?.name || 'Player'}
          onPlaySound={playSound} onRecordGameResult={recordGameResult} onResetMultiplayer={resetMultiplayer}
          onResetGame={resetGame} onReconnect={reconnect} />

        <RoundEndModal phase={phase} round={round} players={players} roundWinner={getRoundWinner()}
          optionalRules={optionalRules} hiddenTreasures={hiddenTreasures} isMultiplayer={isMultiplayer} isHost={isHost}
          onNextRound={() => { if (isMultiplayer && isHost) sendMessage({ type: 'next-round', payload: {} }); nextRound(); }} />

        {phase === 'gameEnd' && (
          <VictoryScreen players={players} roundWins={useGameStore.getState().roundWins}
            winner={getWinner()} maxRounds={useGameStore.getState().maxRounds}
            onPlayAgain={restartGame} onReturnHome={resetGame} />
        )}
      </div>
    </motion.div>
  );
};
