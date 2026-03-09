import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, calculateScore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePlayerStore } from '@/store/playerStore';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { TradingPost } from './TradingPost';
import { ShipsHold } from './ShipsHold';
import { TreasureStack } from './TreasureStack';
import { BonusTokens } from './BonusTokens';
import { ScoreBoard } from './ScoreBoard';
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GoodsType, Card, Token, BonusToken, Player } from '@/types/game';
import { Home, Swords, CloudLightning, Crosshair, Gift, X, Anchor, Coins, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import bannerLogo from '@/assets/BannerLogo.png';
import { toast } from '@/components/ui/sonner';

// ─── Preload static images at module level ───
const PRELOAD_IMAGES = [
  '/images/doubloons.png', '/images/commissions.png', '/images/fleet.png',
  '/images/supply.png', '/images/ledger-bg.png', '/images/trading-post-bg.png',
  '/images/cargo-hold-bg.png', '/images/wood-bg.png',
  '/Icons/Doubloon.png', '/Icons/rum.png', '/Icons/cannonballs.png',
  '/Icons/silks.png', '/Icons/silver.png', '/Icons/gold.png', '/Icons/gemstones.png',
  '/Icons/RedSeal.png', '/Icons/SilverSeal.png', '/Icons/GoldSeal.png',
  '/Icons/Claim.png', '/Icons/Trade.png',
];
PRELOAD_IMAGES.forEach(src => { const img = new Image(); img.src = src; });

const GOODS_ORDER: GoodsType[] = ['gemstones', 'gold', 'silver', 'silks', 'cannonballs', 'rum'];

// ─── Extracted stable components ───

interface TreasureSupplyPanelProps {
  compact?: boolean;
  tokenStacks: Record<GoodsType, Token[]>;
  bonusTokens: { three: BonusToken[]; four: BonusToken[]; five: BonusToken[] };
  optionalRules: { pirateRaid?: boolean; stormRule?: boolean; treasureChest?: boolean };
  currentPlayerIndex: number;
  localPlayerIndex: number;
  phase: string;
  humanPlayer: Player;
  currentPlayer: Player;
  canUsePirateRaid: () => boolean;
  isRaidMode: boolean;
  setIsRaidMode: (v: boolean) => void;
}

const TreasureSupplyPanel = memo(({ compact = false, tokenStacks, bonusTokens, optionalRules, currentPlayerIndex, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid, isRaidMode, setIsRaidMode }: TreasureSupplyPanelProps) => (
  <div className="space-y-4">
    <div data-tutorial-id="tutorial-market-prices" className={cn("p-4 rounded-xl border border-primary/20 relative overflow-hidden", compact && "p-3")} style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
      <div className="absolute inset-0 bg-background/40 pointer-events-none" />
      <div className="relative z-10">
        <h3 className="font-pirate text-lg text-primary mb-4 text-center">
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

    {/* Pirate Raid Button */}
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

interface OpponentPanelProps {
  opponentPlayer: Player | undefined;
  currentPlayerIndex: number;
  isRaidMode: boolean;
  onRaidCard: (card: Card) => void;
}

const OpponentPanel = memo(({ opponentPlayer, currentPlayerIndex, isRaidMode, onRaidCard }: OpponentPanelProps) => (
  <div className="space-y-4">
    {opponentPlayer && (
      <ShipsHold
        player={opponentPlayer}
        isCurrentPlayer={currentPlayerIndex === 1}
        isOpponent
        isRaidMode={isRaidMode && currentPlayerIndex === 0}
        onRaidCard={onRaidCard}
      />
    )}
    <ScoreBoard />
  </div>
));
OpponentPanel.displayName = 'OpponentPanel';

export const GameBoard = () => {
  const [ready, setReady] = useState(false);
  const { 
    players, 
    currentPlayerIndex, 
    tokenStacks, 
    bonusTokens,
    phase,
    lastAction,
    nextRound,
    resetGame,
    restartGame,
    getRoundWinner,
    getWinner,
    round,
    optionalRules,
    turnCount,
    canUsePirateRaid,
    pirateRaid,
    hiddenTreasures,
    isMultiplayer,
    applyGameState,
    getSerializableState,
    deck,
  } = useGameStore();

  const { actionNotificationDuration } = useSettingsStore();
  const { recordGameResult } = usePlayerStore();
  const { playActionSound, playSound, playMusic, stopMusic } = useGameAudio();
  const { sendMessage, opponentName, isHost, hostId, peerId, latency, state: multiplayerState, onMessage: registerMessageHandler, reset: resetMultiplayer, reconnect } = useMultiplayerStore();
  const isMobile = useIsMobile();
  const { hasSeenTutorial, start: startTutorial, isActive: isTutorialActive } = useTutorialStore();

  const [isRaidMode, setIsRaidMode] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [prevPhase, setPrevPhase] = useState<typeof phase | null>(null);
  // Mobile drawer states
  const [treasureDrawerOpen, setTreasureDrawerOpen] = useState(false);
  const [opponentDrawerOpen, setOpponentDrawerOpen] = useState(false);
  const [tradingPostCollapsed, setTradingPostCollapsed] = useState(false);
  const [isExchangeMode, setIsExchangeMode] = useState(false);

  // Turn banner state
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const prevPlayerIndexRef = useRef(currentPlayerIndex);

  // Invalid action shake state
  const [shakeKey, setShakeKey] = useState(0);

  // Deck low state
  const isDeckLow = phase === 'playing' && deck.length <= 10;
  const creakRef = useRef<HTMLAudioElement | null>(null);

  // End-of-round flourish
  const [roundFlourish, setRoundFlourish] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  
  // Local player is always players[0] from this client's perspective
  const localPlayerIndex = isMultiplayer ? 0 : players.findIndex((p) => !p.isAI);
  const opponentIndex = isMultiplayer ? 1 : players.findIndex((p) => p.isAI);
  const localPlayer = players[localPlayerIndex >= 0 ? localPlayerIndex : 0];
  const opponentPlayer = opponentIndex >= 0 ? players[opponentIndex] : players[1];
  
  const humanPlayer = localPlayer;
  const aiPlayer = opponentPlayer;

  // Start background music when game starts
  useEffect(() => {
    if (phase === 'playing') {
      playMusic();
    } else if (phase === 'lobby') {
      stopMusic();
    }
  }, [phase, playMusic, stopMusic]);

  // Play sounds for phase changes
  useEffect(() => {
    if (prevPhase !== phase) {
      if (phase === 'playing' && (prevPhase === null || prevPhase === 'lobby' || prevPhase === 'roundEnd')) {
        playSound('new-round');
      } else if (phase === 'roundEnd') {
        const winner = getRoundWinner();
        if (winner && !winner.isAI) {
          playSound('round-win');
        } else if (winner) {
          playSound('round-lose');
        }
      } else if (phase === 'gameEnd') {
        const winner = getWinner();
        if (winner && !winner.isAI) {
          playSound('game-win');
        } else if (winner) {
          playSound('game-lose');
        }
      }
      setPrevPhase(phase);
    }
  }, [phase, prevPhase, getRoundWinner, getWinner, playSound]);

  // Record game result when game ends (single player only)
  useEffect(() => {
    if (phase === 'gameEnd' && prevPhase !== 'gameEnd' && !isMultiplayer) {
      const winner = getWinner();
      if (winner) {
        const playerWon = !winner.isAI;
        recordGameResult(playerWon);
      }
    }
  }, [phase, prevPhase, isMultiplayer, getWinner, recordGameResult]);

  // Show action notification
  useEffect(() => {
    if (lastAction) {
      setShowAction(true);
      playActionSound(lastAction.type);
      const timer = setTimeout(() => setShowAction(false), actionNotificationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, actionNotificationDuration, playActionSound]);

  // Turn banner: show for 900ms when it becomes player's turn
  useEffect(() => {
    if (phase === 'playing' && currentPlayerIndex === localPlayerIndex && prevPlayerIndexRef.current !== localPlayerIndex) {
      setShowTurnBanner(true);
      const timer = setTimeout(() => setShowTurnBanner(false), 900);
      return () => clearTimeout(timer);
    }
    prevPlayerIndexRef.current = currentPlayerIndex;
  }, [currentPlayerIndex, phase, localPlayerIndex]);

  // Deck-low creak ambience (respects sound settings)
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
        if (creakRef.current) {
          creakRef.current.pause();
          creakRef.current.currentTime = 0;
        }
      }
    };

    updateCreak();
    const unsub = useSettingsStore.subscribe(updateCreak);

    return () => {
      unsub();
      if (creakRef.current && !isDeckLow) {
        creakRef.current.pause();
      }
    };
  }, [isDeckLow]);

  // End-of-round flourish
  useEffect(() => {
    if (phase === 'roundEnd' && prevPhase === 'playing') {
      setRoundFlourish(true);
      const timer = setTimeout(() => setRoundFlourish(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, prevPhase]);

  // Invalid action trigger
  const triggerInvalidAction = useCallback(() => {
    setShakeKey(prev => prev + 1);
    playSound('error');
  }, [playSound]);

  // Auto-start tutorial on first game (with a brief delay so the board renders first)
  const hasStartedTutorialRef = useRef(false);
  useEffect(() => {
    if (!hasSeenTutorial && !isTutorialActive && !hasStartedTutorialRef.current && phase === 'playing') {
      hasStartedTutorialRef.current = true;
      const timer = setTimeout(() => startTutorial(), 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial, isTutorialActive, phase, startTutorial]);


  const prevMultiplayerStateRef = useRef(multiplayerState);

  // Host: Send game state to reconnecting guest
  useEffect(() => {
    const wasDisconnected = prevMultiplayerStateRef.current === 'disconnected' || 
                            prevMultiplayerStateRef.current === 'hosting';
    const nowConnected = multiplayerState === 'connected';
    if (isMultiplayer && isHost && phase === 'playing' && wasDisconnected && nowConnected) {
      const gameState = getSerializableState();
      sendMessage({ type: 'rejoin-sync', payload: { gameState } });
    }
    prevMultiplayerStateRef.current = multiplayerState;
  }, [isMultiplayer, isHost, phase, multiplayerState, sendMessage, getSerializableState]);

  // Listen for multiplayer messages (game state sync only — chat handled by MultiplayerChat)
  useEffect(() => {
    if (isMultiplayer && (phase === 'playing' || phase === 'roundEnd')) {
      const unsubscribe = registerMessageHandler((message) => {
        if (message.type === 'game-state') {
          const payload = message.payload as { gameState: any };
          applyGameState(payload.gameState, true);
        } else if (message.type === 'next-round') {
          nextRound();
        }
      });
      return unsubscribe;
    }
  }, [isMultiplayer, phase, applyGameState, registerMessageHandler, nextRound]);

  // Sync game state after each action in multiplayer
  const prevLastActionRef = useRef(lastAction);
  useEffect(() => {
    if (isMultiplayer && phase === 'playing' && lastAction && lastAction !== prevLastActionRef.current) {
      if (currentPlayerIndex !== localPlayerIndex) {
        const gs = getSerializableState();
        sendMessage({ type: 'game-state', payload: { gameState: gs } });
      }
      prevLastActionRef.current = lastAction;
    }
  }, [isMultiplayer, phase, lastAction, currentPlayerIndex, sendMessage, getSerializableState]);

  const handlePirateRaid = (card: Card) => {
    pirateRaid(card.id);
    setIsRaidMode(false);
  };

  const activeRulesCount = Object.values(optionalRules).filter(Boolean).length;

  // ─── Stable props for extracted panels ───
  const treasureSupplyProps = useMemo(() => ({
    tokenStacks, bonusTokens, optionalRules, currentPlayerIndex, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid,
  }), [tokenStacks, bonusTokens, optionalRules, currentPlayerIndex, localPlayerIndex, phase, humanPlayer, currentPlayer, canUsePirateRaid]);

  const opponentPanelProps = useMemo(() => ({
    opponentPlayer, currentPlayerIndex, isRaidMode, onRaidCard: handlePirateRaid,
  }), [opponentPlayer, currentPlayerIndex, isRaidMode]);

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
      onAnimationComplete={() => { if (!ready) setReady(true); }}
      ref={() => { if (!ready) requestAnimationFrame(() => setReady(true)); }}
    >
      {/* Deck-low vignette overlay */}
      <AnimatePresence>
        {isDeckLow && (
          <motion.div
            className="deck-low-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* In-game Tutorial — auto-starts on first game */}
      <Tutorial />

      {/* Turn Banner */}
      <TurnBanner show={showTurnBanner} />

      {/* Action Notification */}
      <ActionNotification action={lastAction} show={showAction} />

      {/* Interstitial Ad — round end only */}
      <InterstitialAd trigger={phase === 'roundEnd'} round={round} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-3 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={bannerLogo} alt="Privateer: Letters of Marque" className="h-40 sm:h-48 lg:h-56 object-contain" />
            
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
            {isMultiplayer && phase === 'playing' && (
              <ConnectionIndicator className="hidden sm:flex" />
            )}
            
            {optionalRules.stormRule && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CloudLightning className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">
                  {3 - (turnCount % 3)} turn{3 - (turnCount % 3) !== 1 ? 's' : ''} to storm
                </span>
              </div>
            )}

            {lastAction && (
              <motion.span
                key={lastAction.description}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-muted-foreground px-3 py-1 bg-card rounded-full border border-border hidden lg:block"
              >
                {lastAction.playerName} {lastAction.description}
              </motion.span>
            )}
            
            <SettingsPanel />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-pirate text-primary">Abandon Voyage?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your current game progress will be lost. Are you sure you want to return to port?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Playing</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { if (!isMultiplayer && phase === 'playing') { recordGameResult(false); } resetGame(); }} className="bg-destructive hover:bg-destructive/90">
                    Return to Port
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════
            PHONE LAYOUT — stacked, drawers for treasure/opponent
            ════════════════════════════════════════════════════════════════ */}
        <div className="block md:hidden space-y-3">
          {/* Drawer triggers bar */}
          {/* Mini scoreboard bar */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-card/60 border border-border text-xs">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-primary" />
              <span className="text-foreground font-medium">{humanPlayer?.name?.split(' ')[0]}</span>
              <span className="text-primary font-pirate">{calculateScore(humanPlayer, players)}</span>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-medium">{opponentPlayer?.name?.split(' ')[0]}</span>
              <span className="text-accent font-pirate">{calculateScore(opponentPlayer, players)}</span>
            </div>
          </div>

          {/* Drawer triggers bar */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Treasure drawer */}
            <Sheet open={treasureDrawerOpen} onOpenChange={setTreasureDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-primary/30 text-primary">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs">Treasure</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm bg-card border-primary/20 p-4 overflow-y-auto">
                <SheetTitle className="font-pirate text-primary text-lg mb-4">Treasure Supply</SheetTitle>
                <TreasureSupplyPanel compact {...treasureSupplyProps} isRaidMode={isRaidMode} setIsRaidMode={setIsRaidMode} />
              </SheetContent>
            </Sheet>

            {/* Center: Storm indicator (mobile) */}
            {optionalRules.stormRule && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-blue-400">
                  {3 - (turnCount % 3)} to storm
                </span>
              </div>
            )}

            {/* Right: Opponent drawer with badges */}
            <Sheet open={opponentDrawerOpen} onOpenChange={setOpponentDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-accent/30 text-accent">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Opponent</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/20 text-[10px] font-bold">
                    {opponentPlayer?.hand.length}/{7}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm bg-card border-accent/20 p-4 overflow-y-auto">
                <SheetTitle className="font-pirate text-accent text-lg mb-4">Opponent & Ledger</SheetTitle>
                <OpponentPanel {...opponentPanelProps} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Trading Post — collapsible on phone */}
          <div className="space-y-1">
            <button
              onClick={() => setTradingPostCollapsed(!tradingPostCollapsed)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-card/50 border border-border text-sm"
            >
              <span className="font-pirate text-primary text-sm">Trading Post</span>
              {tradingPostCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {!tradingPostCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <TradingPost layout="phone" onModeChange={setIsExchangeMode} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ship's Hold — hidden during exchange mode */}
          <AnimatePresence>
            {!isExchangeMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'overflow-hidden transition-all duration-400',
                  phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed'
                )}
              >
                {humanPlayer && (
                  <ShipsHold
                    player={humanPlayer}
                    isCurrentPlayer={currentPlayerIndex === localPlayerIndex}
                    layout="phone"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TABLET LAYOUT — board composition, all panels docked
            ════════════════════════════════════════════════════════════════ */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-3 gap-4">
            {/* Left column: Opponent + ScoreBoard */}
            <aside className="col-span-1 space-y-4">
              {opponentPlayer && (
                <ShipsHold
                  player={opponentPlayer}
                  isCurrentPlayer={currentPlayerIndex === opponentIndex}
                  isOpponent
                  isRaidMode={isRaidMode && currentPlayerIndex === localPlayerIndex}
                  onRaidCard={handlePirateRaid}
                  layout="tablet"
                />
              )}
              <ScoreBoard />
            </aside>

            {/* Center column: Trading Post + Player Hold */}
            <main
              className={cn(
                "col-span-1 space-y-4",
                phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed'
              )}
            >
              <TradingPost layout="tablet" onModeChange={setIsExchangeMode} />
              <AnimatePresence>
                {!isExchangeMode && humanPlayer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShipsHold
                      player={humanPlayer}
                      isCurrentPlayer={currentPlayerIndex === localPlayerIndex}
                      layout="tablet"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Right column: Treasure Supply + Bonuses */}
            <aside className="col-span-1 space-y-4">
              <TreasureSupplyPanel {...treasureSupplyProps} isRaidMode={isRaidMode} setIsRaidMode={setIsRaidMode} />
            </aside>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            DESKTOP LAYOUT — Trading Post top, Hold bottom, sidebars
            ════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-6">
            {/* Left sidebar - Treasure & Bonuses (fixed) */}
            <aside className="col-span-1 space-y-4">
              <TreasureSupplyPanel {...treasureSupplyProps} isRaidMode={isRaidMode} setIsRaidMode={setIsRaidMode} />
            </aside>

            {/* Main game area — Trading Post top, Hold bottom */}
            <main
              className={cn(
                "col-span-2 space-y-6",
                phase === 'playing' && currentPlayerIndex === localPlayerIndex ? 'zone-active' : 'zone-dimmed'
              )}
            >
              {/* Trading Post — top center */}
              <TradingPost layout="desktop" onModeChange={setIsExchangeMode} />

              {/* Player's Hold — hidden during exchange */}
              <AnimatePresence>
                {!isExchangeMode && humanPlayer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShipsHold
                      player={humanPlayer}
                      isCurrentPlayer={currentPlayerIndex === localPlayerIndex}
                      layout="desktop"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Right sidebar — Opponent & Scoreboard (fixed) */}
            <aside className="col-span-1 space-y-4">
              {opponentPlayer && (
                <ShipsHold
                  player={opponentPlayer}
                  isCurrentPlayer={currentPlayerIndex === opponentIndex}
                  isOpponent
                  isRaidMode={isRaidMode && currentPlayerIndex === localPlayerIndex}
                  onRaidCard={handlePirateRaid}
                  layout="desktop"
                />
              )}
              <ScoreBoard />
            </aside>
          </div>
        </div>

        {/* Turn indicator overlay */}
        <AnimatePresence>
          {currentPlayerIndex !== localPlayerIndex && phase === 'playing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-card/95 border border-primary/30 shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    {isMultiplayer ? (
                      <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    ) : (
                      <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    )}
                  </motion.div>
                  <span className="font-pirate text-lg sm:text-xl text-primary">
                    {`${opponentPlayer?.name || opponentName || 'The Captain'} is pondering their next move…`}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multiplayer Chat */}
        <MultiplayerChat
          isMultiplayer={isMultiplayer}
          phase={phase}
          localPlayerName={localPlayer?.name || 'Player'}
          sendMessage={sendMessage}
          registerMessageHandler={registerMessageHandler}
          playSound={playSound}
        />

        {/* Disconnect Modal */}
        <DisconnectModal
          isMultiplayer={isMultiplayer}
          multiplayerState={multiplayerState}
          phase={phase}
          isHost={isHost}
          peerId={peerId}
          hostId={hostId}
          localPlayerName={localPlayer?.name || 'Player'}
          onPlaySound={playSound}
          onRecordGameResult={recordGameResult}
          onResetMultiplayer={resetMultiplayer}
          onResetGame={resetGame}
          onReconnect={reconnect}
        />

        {/* Voyage End Modal */}
        <RoundEndModal
          phase={phase}
          round={round}
          players={players}
          roundWinner={getRoundWinner()}
          optionalRules={optionalRules}
          hiddenTreasures={hiddenTreasures}
          isMultiplayer={isMultiplayer}
          isHost={isHost}
          onNextRound={() => {
            if (isMultiplayer && isHost) {
              sendMessage({ type: 'next-round', payload: {} });
            }
            nextRound();
          }}
        />

        {/* Game End — Victory Screen */}
        {phase === 'gameEnd' && (
          <VictoryScreen
            players={players}
            roundWins={useGameStore.getState().roundWins}
            winner={getWinner()}
            maxRounds={useGameStore.getState().maxRounds}
            onPlayAgain={restartGame}
            onReturnHome={resetGame}
          />
        )}
      </div>
    </motion.div>
  );
};
