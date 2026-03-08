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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { GoodsType, Card, Token, BonusToken, Player } from '@/types/game';
import { Trophy, RotateCcw, Home, Swords, CloudLightning, Crosshair, Gift, X, MessageCircle, Send, Users, Anchor, WifiOff, Crown, Coins, Medal, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeChatMessage, sanitizePlayerName, isValidChatPayload, CHAT_MESSAGE_MAX_LENGTH } from '@/lib/security';
import bannerLogo from '@/assets/BannerLogo.png';

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
    <div className={cn("p-4 rounded-xl border border-primary/20 relative overflow-hidden", compact && "p-3")} style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
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

  const [isRaidMode, setIsRaidMode] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [prevPhase, setPrevPhase] = useState<typeof phase | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [disconnectTimer, setDisconnectTimer] = useState<number>(0);
  const disconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const showChatRef = useRef(showChat);

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
  
  // Keep ref in sync with state
  useEffect(() => {
    showChatRef.current = showChat;
  }, [showChat]);

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

  // Deck-low creak ambience
  useEffect(() => {
    if (isDeckLow) {
      if (!creakRef.current) {
        const creak = new Audio('/sounds/sea_sounds.wav');
        creak.loop = true;
        creak.volume = 0.15;
        creakRef.current = creak;
      }
      creakRef.current.play().catch(() => {});
    } else {
      if (creakRef.current) {
        creakRef.current.pause();
        creakRef.current.currentTime = 0;
      }
    }
    return () => {
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

  // Track previous multiplayer state to detect reconnection
  const prevMultiplayerStateRef = useRef(multiplayerState);
  
  // Detect multiplayer disconnect
  useEffect(() => {
    if (isMultiplayer && multiplayerState === 'disconnected' && phase === 'playing') {
      setShowDisconnectModal(true);
      setDisconnectTimer(0);
      disconnectTimerRef.current = setInterval(() => {
        setDisconnectTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (disconnectTimerRef.current) {
        clearInterval(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      if (multiplayerState === 'connected') {
        setShowDisconnectModal(false);
        setDisconnectTimer(0);
      }
    }
    return () => {
      if (disconnectTimerRef.current) {
        clearInterval(disconnectTimerRef.current);
      }
    };
  }, [isMultiplayer, multiplayerState, phase]);

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

  // Listen for multiplayer messages
  useEffect(() => {
    if (isMultiplayer && (phase === 'playing' || phase === 'roundEnd')) {
      const unsubscribe = registerMessageHandler((message) => {
        if (message.type === 'chat' && isValidChatPayload(message.payload)) {
          const payload = message.payload;
          const sanitizedText = sanitizeChatMessage(payload.text);
          const sanitizedSender = sanitizePlayerName(payload.sender);
          if (sanitizedText) {
            setChatMessages((prev) => [...prev, { sender: sanitizedSender, text: sanitizedText }]);
            playSound('message');
            if (!showChatRef.current) {
              setUnreadMessages((prev) => prev + 1);
            }
          }
        } else if (message.type === 'game-state') {
          const payload = message.payload as { gameState: any };
          applyGameState(payload.gameState, true);
        } else if (message.type === 'next-round') {
          nextRound();
        }
      });
      return unsubscribe;
    }
  }, [isMultiplayer, phase, applyGameState, registerMessageHandler, playSound, nextRound]);

  // Sync game state after each action in multiplayer
  const prevLastActionRef = useRef(lastAction);
  useEffect(() => {
    if (isMultiplayer && phase === 'playing' && lastAction && lastAction !== prevLastActionRef.current) {
      if (currentPlayerIndex !== localPlayerIndex) {
        // Current player just changed away from local → send state
        const gs = getSerializableState();
        sendMessage({ type: 'game-state', payload: { gameState: gs } });
      }
      prevLastActionRef.current = lastAction;
    }
  }, [isMultiplayer, phase, lastAction, currentPlayerIndex, sendMessage, getSerializableState]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [chatMessages]);

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const sanitizedText = sanitizeChatMessage(chatInput);
    if (!sanitizedText) return;
    const message = { sender: localPlayer?.name || 'You', text: sanitizedText };
    setChatMessages((prev) => [...prev, message]);
    sendMessage({ type: 'chat', payload: message });
    setChatInput('');
  };

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
            
            <Button
              variant="ghost"
              size="icon"
              onClick={resetGame}
              className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════
            PHONE LAYOUT — stacked, drawers for treasure/opponent
            ════════════════════════════════════════════════════════════════ */}
        <div className="block md:hidden space-y-3">
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

            {/* Right: Opponent drawer */}
            <Sheet open={opponentDrawerOpen} onOpenChange={setOpponentDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-accent/30 text-accent">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Opponent</span>
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
            </motion.main>

            {/* Right sidebar — Opponent & Scoreboard (fixed) */}
            <motion.aside
              className="col-span-1 space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.aside>
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
                    {isMultiplayer 
                      ? `Waiting for ${opponentName || 'opponent'}...` 
                      : 'Pirate AI is thinking...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multiplayer Chat */}
        {isMultiplayer && (
          <div className="fixed bottom-4 right-4 z-40">
            {showChat ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-72 sm:w-80 bg-card border border-primary/30 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span className="font-pirate text-primary">Chat</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="h-6 w-6">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-48 p-3 overflow-y-auto" ref={chatScrollRef}>
                  <div className="space-y-2">
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center">No messages yet</p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn(
                        'text-sm p-2 rounded-lg max-w-[85%]',
                        msg.sender === localPlayer?.name 
                          ? 'bg-primary/20 ml-auto' 
                          : 'bg-muted'
                      )}>
                        <p className="text-xs font-bold text-primary/80">{msg.sender}</p>
                        <p className="text-foreground">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-2 border-t border-border flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button size="icon" onClick={sendChatMessage} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Button
                onClick={() => {
                  setShowChat(true);
                  setUnreadMessages(0);
                }}
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-primary hover:bg-primary/90 shadow-lg relative"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Disconnect Modal */}
        <AnimatePresence>
          {showDisconnectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={cn(
                  "bg-card p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center",
                  !isHost ? "border border-primary/30" : "border border-destructive/30"
                )}
              >
                {!isHost ? (
                  <>
                    <WifiOff className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
                    <h2 className="font-pirate text-xl sm:text-2xl text-destructive mb-2">Host Disconnected</h2>
                    <p className="text-muted-foreground mb-4 text-sm">The host has lost connection.</p>
                    <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Time disconnected</p>
                      <p className="font-pirate text-2xl text-foreground">
                        {Math.floor(disconnectTimer / 60)}:{(disconnectTimer % 60).toString().padStart(2, '0')}
                      </p>
                      {disconnectTimer < 30 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Claim victory in {30 - disconnectTimer}s
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {disconnectTimer >= 30 && (
                        <Button 
                          onClick={() => {
                            playSound('game-win');
                            recordGameResult(true);
                            setShowDisconnectModal(false);
                            resetMultiplayer();
                            resetGame();
                          }} 
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          Claim Victory
                        </Button>
                      )}
                      <Button 
                        variant={disconnectTimer >= 30 ? "outline" : "default"}
                        className={cn("w-full", disconnectTimer < 30 && "game-button")}
                        disabled
                      >
                        <WifiOff className="w-5 h-5 mr-2" />
                        Waiting for Host...
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => { setShowDisconnectModal(false); setDisconnectTimer(0); resetMultiplayer(); resetGame(); }} 
                        className="w-full text-muted-foreground"
                      >
                        <Home className="w-5 h-5 mr-2" />
                        Return to Lobby
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
                    <h2 className="font-pirate text-xl sm:text-2xl text-destructive mb-2">Connection Lost</h2>
                    <p className="text-muted-foreground mb-4 text-sm">Your opponent has disconnected.</p>
                    <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Time disconnected</p>
                      <p className="font-pirate text-2xl text-foreground">
                        {Math.floor(disconnectTimer / 60)}:{(disconnectTimer % 60).toString().padStart(2, '0')}
                      </p>
                      {disconnectTimer < 30 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Claim victory in {30 - disconnectTimer}s
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {disconnectTimer >= 30 && (
                        <Button 
                          onClick={() => {
                            playSound('game-win');
                            recordGameResult(true);
                            setShowDisconnectModal(false);
                            resetMultiplayer();
                            resetGame();
                          }} 
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          Claim Victory
                        </Button>
                      )}
                      <Button 
                        onClick={async () => {
                          const gameCode = isHost ? peerId : hostId;
                          if (gameCode) {
                            setIsReconnecting(true);
                            try {
                              await reconnect(gameCode, localPlayer?.name || 'Player');
                              setShowDisconnectModal(false);
                              setDisconnectTimer(0);
                            } catch (err) {
                              if (import.meta.env.DEV) console.error('Reconnect failed:', err);
                            } finally {
                              setIsReconnecting(false);
                            }
                          }
                        }}
                        disabled={isReconnecting}
                        variant={disconnectTimer >= 30 ? "outline" : "default"}
                        className={cn("w-full", disconnectTimer < 30 && "game-button")}
                      >
                        {isReconnecting ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                              <RotateCcw className="w-5 h-5 mr-2" />
                            </motion.div>
                            Reconnecting...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Wait for Reconnect
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => { setShowDisconnectModal(false); setDisconnectTimer(0); resetMultiplayer(); resetGame(); }} 
                        className="w-full text-muted-foreground"
                      >
                        <Home className="w-5 h-5 mr-2" />
                        Return to Lobby
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voyage End Modal */}
        <AnimatePresence>
          {phase === 'roundEnd' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              {/* Decorative flourish lines */}
              <motion.div
                className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              />

              <motion.div
                initial={{ scale: 0.85, y: 30, rotateX: 5 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-card p-6 sm:p-8 rounded-2xl border border-primary/30 shadow-2xl max-w-md w-full"
              >
                <div className="text-center">
                  <Anchor className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-4" />
                  <h2 className="font-pirate text-2xl sm:text-3xl text-primary mb-2">
                    Voyage {round} Complete!
                  </h2>
                  
                  {getRoundWinner() && (
                    <p className="text-lg sm:text-xl mb-4">
                      <span className="text-primary font-bold">{getRoundWinner()?.name}</span>{' '}
                      wins this voyage!
                    </p>
                  )}

                  {optionalRules.treasureChest && hiddenTreasures.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-primary" />
                        <span className="font-pirate text-primary">Hidden Cargo Revealed!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {hiddenTreasures.map((treasure) => {
                          const player = players.find(p => p.id === treasure.playerId);
                          return (
                            <div key={treasure.playerId} className="text-muted-foreground">
                              {player?.name}: +{treasure.tokens.reduce((sum, t) => sum + t.value, 0)} doubloons
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {players.map((player) => (
                      <div key={player.id} className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="font-bold text-foreground text-sm sm:text-base">{player.name}</p>
                        <p className="text-2xl sm:text-3xl font-pirate text-primary">{calculateScore(player, players)}</p>
                        <p className="text-xs text-muted-foreground">doubloons</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => {
                      if (isMultiplayer && isHost) {
                        sendMessage({ type: 'next-round', payload: {} });
                      }
                      nextRound();
                    }} 
                    className="game-button w-full"
                    disabled={isMultiplayer && !isHost}
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    {isMultiplayer && !isHost 
                      ? 'Waiting for host...' 
                      : round >= 3 ? 'See Final Results' : `Begin Voyage ${round + 1}`}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game End Modal */}
        <AnimatePresence>
          {phase === 'gameEnd' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card p-6 sm:p-8 rounded-2xl border border-primary/30 shadow-2xl max-w-md w-full text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-primary mx-auto mb-4" />
                </motion.div>
                
                <h2 className="font-pirate text-2xl sm:text-3xl text-primary mb-1">
                  {getWinner()?.isAI ? 'Defeated!' : 'Admiral Appointed!'}
                </h2>
                <h3 className="font-pirate text-lg sm:text-xl text-primary/80 mb-4">
                  {getWinner()?.isAI ? '' : 'Letters of Marque Awarded'}
                </h3>
                
                <p className="text-lg sm:text-xl mb-6">
                  <span className="text-primary font-bold">{getWinner()?.name}</span>{' '}
                  {getWinner()?.isAI ? 'claims victory!' : 'has been named Admiral!'}
                </p>

                <Button onClick={resetGame} className="game-button w-full">
                  <Home className="w-5 h-5 mr-2" />
                  Return to Port
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
