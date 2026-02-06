import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, calculateScore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePlayerStore } from '@/store/playerStore';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { TradingPost } from './TradingPost';
import { ShipsHold } from './ShipsHold';
import { TreasureStack } from './TreasureStack';
import { BonusTokens } from './BonusTokens';
import { ScoreBoard } from './ScoreBoard';
import { ActionNotification } from './ActionNotification';
import { SettingsPanel } from './SettingsPanel';
import { ConnectionIndicator } from './ConnectionIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoodsType, Card } from '@/types/game';
import { Trophy, RotateCcw, Home, Swords, CloudLightning, Crosshair, Gift, X, MessageCircle, Send, Users, Anchor, WifiOff, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeChatMessage, sanitizePlayerName, isValidChatPayload, CHAT_MESSAGE_MAX_LENGTH } from '@/lib/security';

const GOODS_ORDER: GoodsType[] = ['gemstones', 'gold', 'silver', 'silks', 'cannonballs', 'rum'];

export const GameBoard = () => {
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
  } = useGameStore();

  const { actionNotificationDuration } = useSettingsStore();
  const { recordGameResult } = usePlayerStore();
  const { playActionSound, playSound, playMusic, stopMusic } = useGameAudio();
  const { sendMessage, opponentName, isHost, hostId, peerId, latency, state: multiplayerState, onMessage: registerMessageHandler, reset: resetMultiplayer, reconnect } = useMultiplayerStore();

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
  
  // Keep ref in sync with state
  useEffect(() => {
    showChatRef.current = showChat;
  }, [showChat]);

  const currentPlayer = players[currentPlayerIndex];
  
  // In multiplayer, use player indices; in single player, find AI/human
  const localPlayer = isMultiplayer ? players[0] : players.find((p) => !p.isAI)!;
  const opponentPlayer = isMultiplayer ? players[1] : players.find((p) => p.isAI);
  
  // For backwards compatibility with existing code
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
        // Round starting - "Hoist the sails!"
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

  // Show action notification when lastAction changes and play sound
  useEffect(() => {
    if (lastAction) {
      setShowAction(true);
      playActionSound(lastAction.type);
      const timer = setTimeout(() => setShowAction(false), actionNotificationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, actionNotificationDuration, playActionSound]);

  // Track previous multiplayer state to detect reconnection
  const prevMultiplayerStateRef = useRef(multiplayerState);
  
  // Detect multiplayer disconnect and start timer
  useEffect(() => {
    if (isMultiplayer && multiplayerState === 'disconnected' && phase === 'playing') {
      setShowDisconnectModal(true);
      setDisconnectTimer(0);
      
      // Start countdown timer for claim victory
      disconnectTimerRef.current = setInterval(() => {
        setDisconnectTimer((prev) => prev + 1);
      }, 1000);
    } else {
      // Clear timer if reconnected
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

  // Host: Send game state to reconnecting guest when connection re-establishes
  useEffect(() => {
    const wasDisconnected = prevMultiplayerStateRef.current === 'disconnected' || 
                            prevMultiplayerStateRef.current === 'hosting';
    const nowConnected = multiplayerState === 'connected';
    
    // If we're the host, game is in progress, and connection just re-established
    if (isMultiplayer && isHost && phase === 'playing' && wasDisconnected && nowConnected) {
      console.log('Host detected reconnection, sending rejoin-sync to guest');
      // Send current game state to the reconnected guest
      const gameState = getSerializableState();
      sendMessage({ type: 'rejoin-sync', payload: { gameState } });
    }
    
    // Update the ref for next comparison
    prevMultiplayerStateRef.current = multiplayerState;
  }, [isMultiplayer, isHost, phase, multiplayerState, sendMessage, getSerializableState]);

  // Listen for multiplayer messages (chat and game state sync)
  useEffect(() => {
    if (isMultiplayer && (phase === 'playing' || phase === 'roundEnd')) {
      const unsubscribe = registerMessageHandler((message) => {
        console.log('GameBoard received message:', message.type);
        if (message.type === 'chat' && isValidChatPayload(message.payload)) {
          // Validate and sanitize incoming chat message
          const payload = message.payload;
          const sanitizedText = sanitizeChatMessage(payload.text);
          const sanitizedSender = sanitizePlayerName(payload.sender);
          
          // Only add if message has content after sanitization
          if (sanitizedText) {
            setChatMessages((prev) => [...prev, { sender: sanitizedSender, text: sanitizedText }]);
            // Always play sound for incoming messages
            playSound('message');
            // Increment unread if chat is closed
            if (!showChatRef.current) {
              setUnreadMessages((prev) => prev + 1);
            }
          }
        } else if (message.type === 'game-state') {
          // Receive game state update from opponent (swap players for our perspective)
          const payload = message.payload as { gameState: any };
          console.log('Received game state sync from opponent');
          applyGameState(payload.gameState, true);
        } else if (message.type === 'next-round') {
          // Host triggered next round, sync it
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
      // Only sync if it was our turn (currentPlayerIndex was 0 before action completed)
      // After the action, currentPlayerIndex switches, so if it's now 1, we just made a move
      if (currentPlayerIndex === 1) {
        console.log('Sending game state sync to opponent');
        const gameState = getSerializableState();
        sendMessage({ type: 'game-state', payload: { gameState } });
      }
      prevLastActionRef.current = lastAction;
    }
  }, [isMultiplayer, phase, lastAction, currentPlayerIndex, sendMessage, getSerializableState]);

  // Auto-scroll chat when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [chatMessages]);

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    // Sanitize outgoing message as well (defense in depth)
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

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Action Notification */}
      <ActionNotification action={lastAction} show={showAction} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <h1 className="font-pirate text-3xl lg:text-4xl text-primary">Privateer</h1>
            
            {/* Active Rules Indicators */}
            {activeRulesCount > 0 && (
              <div className="flex items-center gap-1">
                {optionalRules.stormRule && (
                  <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30" title="Storm Rule Active">
                    <CloudLightning className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                {optionalRules.pirateRaid && (
                  <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30" title="Pirate Raid Active">
                    <Crosshair className="w-4 h-4 text-red-400" />
                  </div>
                )}
                {optionalRules.treasureChest && (
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30" title="Treasure Chest Active">
                    <Gift className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Multiplayer Connection Indicator */}
            {isMultiplayer && phase === 'playing' && (
              <ConnectionIndicator className="hidden sm:flex" />
            )}
            
            {/* Storm Rule Turn Counter */}
            {optionalRules.stormRule && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
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
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Token stacks */}
          <motion.aside
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 rounded-xl bg-card border border-primary/20">
              <h3 className="font-pirate text-lg text-primary mb-4 text-center">Doubloons</h3>
              <div className="grid grid-cols-2 gap-4">
                {GOODS_ORDER.map((type) => (
                  <TreasureStack key={type} type={type} tokens={tokenStacks[type]} />
                ))}
              </div>
            </div>

            <BonusTokens
              threeCards={bonusTokens.three}
              fourCards={bonusTokens.four}
              fiveCards={bonusTokens.five}
            />

            {/* Pirate Raid Button */}
            {optionalRules.pirateRaid && currentPlayerIndex === 0 && phase === 'playing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-card border border-red-500/20"
              >
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
              </motion.div>
            )}
          </motion.aside>

          {/* Main game area */}
          <motion.main
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Opponent's Hold */}
            {opponentPlayer && (
              <ShipsHold
                player={opponentPlayer}
                isCurrentPlayer={currentPlayerIndex === 1}
                isOpponent
                isRaidMode={isRaidMode && currentPlayerIndex === 0}
                onRaidCard={handlePirateRaid}
              />
            )}

            {/* Trading Post */}
            <TradingPost />

            {/* Player's Hold */}
            {humanPlayer && (
              <ShipsHold
                player={humanPlayer}
                isCurrentPlayer={currentPlayerIndex === 0}
              />
            )}

            {/* Turn indicator */}
            <AnimatePresence>
              {currentPlayerIndex === 1 && phase === 'playing' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
                >
                  <div className="px-6 py-3 rounded-xl bg-card/95 border border-primary/30 shadow-xl">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      >
                        {isMultiplayer ? (
                          <Anchor className="w-6 h-6 text-primary" />
                        ) : (
                          <Swords className="w-6 h-6 text-primary" />
                        )}
                      </motion.div>
                      <span className="font-pirate text-xl text-primary">
                        {isMultiplayer 
                          ? `Waiting for ${opponentName || 'opponent'}...` 
                          : 'Pirate AI is thinking...'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>

          {/* Right sidebar - Scoreboard */}
          <motion.aside
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ScoreBoard />
          </motion.aside>
        </div>

        {/* Multiplayer Chat */}
        {isMultiplayer && (
          <div className="fixed bottom-4 right-4 z-40">
            {showChat ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-80 bg-card border border-primary/30 rounded-xl shadow-xl overflow-hidden"
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
                className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 shadow-lg relative"
              >
                <MessageCircle className="w-5 h-5" />
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
                  "bg-card p-8 rounded-2xl shadow-2xl max-w-md w-full text-center",
                  !isHost ? "border border-primary/30" : "border border-destructive/30"
                )}
              >
                {/* Guest sees host disconnected - show timer and claim victory option */}
                {!isHost ? (
                  <>
                    <WifiOff className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h2 className="font-pirate text-2xl text-destructive mb-2">
                      Host Disconnected
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      The host has lost connection to the game.
                    </p>
                    
                    {/* Disconnect Timer */}
                    <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Time disconnected</p>
                      <p className="font-pirate text-2xl text-foreground">
                        {Math.floor(disconnectTimer / 60)}:{(disconnectTimer % 60).toString().padStart(2, '0')}
                      </p>
                      {disconnectTimer < 30 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Claim victory available in {30 - disconnectTimer}s
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {/* Claim Victory Button - available after 30 seconds */}
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
                        className={cn(
                          "w-full",
                          disconnectTimer < 30 && "game-button"
                        )}
                        disabled
                      >
                        <WifiOff className="w-5 h-5 mr-2" />
                        Waiting for Host...
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowDisconnectModal(false);
                          setDisconnectTimer(0);
                          resetMultiplayer();
                          resetGame();
                        }} 
                        className="w-full text-muted-foreground"
                      >
                        <Home className="w-5 h-5 mr-2" />
                        Return to Lobby
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Host sees guest disconnected - wait or claim after timeout */
                  <>
                    <WifiOff className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h2 className="font-pirate text-2xl text-destructive mb-2">
                      Connection Lost
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Your opponent has disconnected from the game.
                    </p>
                    
                    {/* Disconnect Timer */}
                    <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Time disconnected</p>
                      <p className="font-pirate text-2xl text-foreground">
                        {Math.floor(disconnectTimer / 60)}:{(disconnectTimer % 60).toString().padStart(2, '0')}
                      </p>
                      {disconnectTimer < 30 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Claim victory available in {30 - disconnectTimer}s
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {/* Claim Victory Button - available after 30 seconds */}
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
                              console.error('Reconnect failed:', err);
                            } finally {
                              setIsReconnecting(false);
                            }
                          }
                        }}
                        disabled={isReconnecting}
                        variant={disconnectTimer >= 30 ? "outline" : "default"}
                        className={cn(
                          "w-full",
                          disconnectTimer < 30 && "game-button"
                        )}
                      >
                        {isReconnecting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
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
                        onClick={() => {
                          setShowDisconnectModal(false);
                          setDisconnectTimer(0);
                          resetMultiplayer();
                          resetGame();
                        }} 
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
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card p-8 rounded-2xl border border-primary/30 shadow-2xl max-w-md w-full"
              >
                <div className="text-center">
                  <Anchor className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="font-pirate text-3xl text-primary mb-2">
                    Voyage {round} Complete!
                  </h2>
                  
                  {getRoundWinner() && (
                    <p className="text-xl mb-4">
                      <span className="text-primary font-bold">
                        {getRoundWinner()?.name}
                      </span>{' '}
                      wins this voyage!
                    </p>
                  )}

                  {/* Hidden Treasures Reveal */}
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

                  {/* Treasure Manifest */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <p className="font-bold text-foreground">{player.name}</p>
                        <p className="text-3xl font-pirate text-primary">
                          {calculateScore(player)}
                        </p>
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

        {/* Game End Modal - Letters of Marque Awarded */}
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
                className="bg-card p-8 rounded-2xl border border-primary/30 shadow-2xl max-w-md w-full text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Trophy className="w-24 h-24 text-primary mx-auto mb-4" />
                </motion.div>
                
                <h2 className="font-pirate text-3xl text-primary mb-1">
                  {getWinner()?.isAI ? 'Defeated!' : 'Letters of Marque'}
                </h2>
                <h3 className="font-pirate text-xl text-primary/80 mb-4">
                  {getWinner()?.isAI ? '' : 'Awarded!'}
                </h3>
                
                <p className="text-xl mb-6">
                  <span className="text-primary font-bold">
                    {getWinner()?.name}
                  </span>{' '}
                  {getWinner()?.isAI ? 'claims victory!' : 'is the champion privateer!'}
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
    </div>
  );
};
