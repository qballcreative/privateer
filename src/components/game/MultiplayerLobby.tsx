import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Users, Loader2, ArrowLeft, Anchor, Wifi, WifiOff } from 'lucide-react';
import { OptionalRules } from '@/types/game';
import { debugLog } from '@/lib/debugLog';

interface MultiplayerLobbyProps {
  playerName: string;
  onBack: () => void;
  onNameChange: (name: string) => void;
}

export const MultiplayerLobby = ({ playerName, onBack, onNameChange }: MultiplayerLobbyProps) => {
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const { setPlayerName: savePlayerName } = usePlayerStore();
  const { optionalRules } = useSettingsStore();
  
  const { 
    state, 
    peerId, 
    opponentName, 
    error,
    isHost,
    localPlayerName,
    hostGame, 
    joinGame, 
    sendMessage,
    disconnect,
    onMessage,
  } = useMultiplayerStore();
  
  const { startMultiplayerGame, applyGameState, getSerializableState } = useGameStore();

  // Listen for start message from host (when we're the guest)
  // Also handles 'rejoin-sync' for reconnecting mid-game
  useEffect(() => {
    if (state === 'connected') {
      const unsubscribe = onMessage((message) => {
        debugLog('engine', 'Lobby message', message.type);
        if (message.type === 'start') {
          const payload = message.payload as { optionalRules: OptionalRules; gameState: unknown };
          debugLog('engine', 'Guest start', 'Received start with game state');
          applyGameState(payload.gameState, true);
        } else if (message.type === 'rejoin-sync') {
          const payload = message.payload as { gameState: unknown };
          debugLog('engine', 'Guest rejoin', 'Received rejoin-sync with current game state');
          applyGameState(payload.gameState, true);
        }
      });
      return unsubscribe;
    }
  }, [state, applyGameState, onMessage]);

  const handleHost = async () => {
    setMode('host');
    const name = playerName.trim() || 'Captain';
    savePlayerName(name);
    onNameChange(name);
    try {
      await hostGame(name);
    } catch (err) {
      debugLog('engine', 'Host error', 'Failed to host game', { error: String(err) });
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const name = playerName.trim() || 'Captain';
    savePlayerName(name);
    onNameChange(name);
    try {
      await joinGame(joinCode.trim(), name);
    } catch (err) {
      debugLog('engine', 'Join error', 'Failed to join game', { error: String(err) });
    }
  };

  const handleCopyCode = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReady = () => {
    setIsReady(true);
    sendMessage({ type: 'ready', payload: { ready: true } });
  };

  const handleStartGame = () => {
    const hostName = localPlayerName || playerName || 'Captain';
    startMultiplayerGame(hostName, opponentName || 'Opponent', optionalRules, true);
    
    setTimeout(() => {
      const gameState = getSerializableState();
      debugLog('engine', 'Host start', 'Sending game state to guest');
      sendMessage({ type: 'start', payload: { optionalRules, gameState } });
    }, 100);
  };

  const handleBack = () => {
    disconnect();
    if (mode === 'select') {
      onBack();
    } else {
      setMode('select');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card/90 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-accent/30 shadow-2xl max-w-md mx-auto"
    >
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-pirate text-2xl lg:text-3xl text-accent">Multiplayer</h2>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-muted-foreground text-sm mb-4">
              Play against another pirate! One player hosts, the other joins with a code.
            </p>
            
            <Button
              onClick={handleHost}
              variant="outline"
              className="w-full border-accent/30 text-accent hover:bg-accent/10 h-16"
            >
              <Anchor className="w-6 h-6 mr-3" />
              <div className="text-left">
                <p className="font-bold">Host a Game</p>
                <p className="text-xs text-muted-foreground">Create a room and invite a friend</p>
              </div>
            </Button>
            
            <Button
              onClick={() => setMode('join')}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 h-16"
            >
              <Users className="w-6 h-6 mr-3" />
              <div className="text-left">
                <p className="font-bold">Join a Game</p>
                <p className="text-xs text-muted-foreground">Enter a code to join a friend's game</p>
              </div>
            </Button>
          </motion.div>
        )}

        {mode === 'host' && (
          <motion.div
            key="host"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {state === 'hosting' && !opponentName && (
              <>
                <div className="flex items-center justify-center gap-2 text-accent mb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Waiting for opponent...</span>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Share this code:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-background rounded-lg text-center font-mono text-lg tracking-wider">
                      {peerId}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                      className="shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            {state === 'connected' && opponentName && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                  <Wifi className="w-5 h-5" />
                  <span>Connected!</span>
                </div>
                
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-center">
                    <span className="text-muted-foreground">Opponent: </span>
                    <span className="font-bold text-foreground">{opponentName}</span>
                  </p>
                </div>

                <Button
                  onClick={handleStartGame}
                  variant="gold"
                  className="w-full font-pirate"
                >
                  Start Battle!
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {state !== 'connected' && (
              <>
                <p className="text-muted-foreground text-sm">
                  Enter the game code from your friend:
                </p>
                
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter game code..."
                  className="bg-muted/50 border-primary/30 text-center font-mono text-lg tracking-wider"
                />
                
                <Button
                  onClick={handleJoin}
                  variant="gold"
                  className="w-full font-pirate"
                  disabled={!joinCode.trim() || state === 'joining'}
                >
                  {state === 'joining' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Join Game
                    </>
                  )}
                </Button>
              </>
            )}
            
            {state === 'connected' && opponentName && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                  <Wifi className="w-5 h-5" />
                  <span>Connected!</span>
                </div>
                
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-center">
                    <span className="text-muted-foreground">Host: </span>
                    <span className="font-bold text-foreground">{opponentName}</span>
                  </p>
                </div>

                <div className="text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Waiting for host to start...</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};
