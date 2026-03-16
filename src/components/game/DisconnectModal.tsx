/** DisconnectModal — Handles multiplayer disconnection, forfeit detection, and reconnection UI. */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Crown, RotateCcw, Home, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DisconnectModalProps {
  isMultiplayer: boolean;
  multiplayerState: string;
  phase: string;
  isHost: boolean;
  peerId: string | null;
  hostId: string | null;
  localPlayerName: string;
  localPlayerIndex: number;
  opponentForfeited?: boolean;
  onPlaySound: (sound: string) => void;
  onRecordGameResult: (won: boolean) => void;
  onResetMultiplayer: () => void;
  onResetGame: () => void;
  onClaimVictory: (winnerIndex: number) => void;
  onReconnect: (code: string, name: string) => Promise<void>;
}

export const DisconnectModal = ({
  isMultiplayer,
  multiplayerState,
  phase,
  isHost,
  peerId,
  hostId,
  localPlayerName,
  localPlayerIndex,
  opponentForfeited = false,
  onPlaySound,
  onRecordGameResult,
  onResetMultiplayer,
  onResetGame,
  onClaimVictory,
  onReconnect,
}: DisconnectModalProps) => {
  const [showModal, setShowModal] = useState(false);
  const [disconnectTimer, setDisconnectTimer] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Show modal on disconnect during active phases
  useEffect(() => {
    const activePhase = phase === 'playing' || phase === 'roundEnd';
    if (isMultiplayer && multiplayerState === 'disconnected' && activePhase) {
      setShowModal(true);
      setDisconnectTimer(0);
      setCanClaim(false);
      timerRef.current = setInterval(() => {
        setDisconnectTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (multiplayerState === 'connected') {
        setShowModal(false);
        setDisconnectTimer(0);
        setCanClaim(false);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMultiplayer, multiplayerState, phase]);

  // Every 10 seconds, pause and show claim option
  useEffect(() => {
    if (!opponentForfeited && disconnectTimer > 0 && disconnectTimer % 10 === 0) {
      setCanClaim(true);
      // Pause the timer while waiting for user decision
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [disconnectTimer, opponentForfeited]);

  // Instant victory on opponent forfeit — auto-claim
  useEffect(() => {
    if (opponentForfeited && showModal) {
      // Already showing modal, auto-claim
      handleClaimVictory();
    } else if (opponentForfeited && !showModal) {
      setShowModal(true);
      // Short delay then auto-claim
      const t = setTimeout(() => handleClaimVictory(), 500);
      return () => clearTimeout(t);
    }
  }, [opponentForfeited]);

  const handleClaimVictory = () => {
    onPlaySound('game-win');
    onRecordGameResult(true);
    onClaimVictory(localPlayerIndex);
    setShowModal(false);
    onResetMultiplayer();
  };

  const handleWaitMore = () => {
    setCanClaim(false);
    // Resume the timer
    timerRef.current = setInterval(() => {
      setDisconnectTimer((prev) => prev + 1);
    }, 1000);
  };

  const handleReturnToLobby = () => {
    setShowModal(false);
    setDisconnectTimer(0);
    setCanClaim(false);
    onResetMultiplayer();
    onResetGame();
  };

  const handleReconnect = async () => {
    const gameCode = isHost ? peerId : hostId;
    if (gameCode) {
      setIsReconnecting(true);
      try {
        await onReconnect(gameCode, localPlayerName);
        setShowModal(false);
        setDisconnectTimer(0);
        setCanClaim(false);
      } catch (err) {
        if (import.meta.env.DEV) console.error('Reconnect failed:', err);
      } finally {
        setIsReconnecting(false);
      }
    }
  };

  const secondsUntilClaim = 10 - (disconnectTimer % 10);
  const timerDisplay = `${Math.floor(disconnectTimer / 60)}:${(disconnectTimer % 60).toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {showModal && !opponentForfeited && (
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
              'bg-card p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center',
              !isHost ? 'border border-primary/30' : 'border border-destructive/30'
            )}
          >
            <WifiOff className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="font-pirate text-xl sm:text-2xl text-destructive mb-2">
              {!isHost ? 'Host Disconnected' : 'Connection Lost'}
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {!isHost ? 'The host has lost connection.' : 'Your opponent has disconnected.'}
            </p>

            <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Time disconnected</p>
              <p className="font-pirate text-2xl text-foreground">{timerDisplay}</p>
              {!canClaim && (
                <p className="text-xs text-muted-foreground mt-1">
                  Claim victory in {secondsUntilClaim}s
                </p>
              )}
            </div>

            <div className="space-y-3">
              {canClaim && (
                <>
                  <Button onClick={handleClaimVictory} className="w-full bg-primary hover:bg-primary/90">
                    <Crown className="w-5 h-5 mr-2" />
                    Claim Victory
                  </Button>
                  <Button onClick={handleWaitMore} variant="outline" className="w-full">
                    <Clock className="w-5 h-5 mr-2" />
                    Wait 10 More Seconds
                  </Button>
                </>
              )}

              {!canClaim && (
                <>
                  {!isHost ? (
                    <Button variant="default" className="w-full game-button" disabled>
                      <WifiOff className="w-5 h-5 mr-2" />
                      Waiting for Host...
                    </Button>
                  ) : (
                    <Button
                      onClick={handleReconnect}
                      disabled={isReconnecting}
                      variant="default"
                      className="w-full game-button"
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
                  )}
                </>
              )}

              <Button variant="ghost" onClick={handleReturnToLobby} className="w-full text-muted-foreground">
                <Home className="w-5 h-5 mr-2" />
                Return to Lobby
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
