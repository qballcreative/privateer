import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, calculateScore } from '@/store/gameStore';
import { useConsentStore } from '@/store/consentStore';
import { useRemoteConfigStore } from '@/store/remoteConfigStore';
import { isAdsRemoteEnabled } from '@/lib/adProvider';
import { getDebugLogs, clearDebugLogs, subscribeDebugLogs, DebugLogEntry, DebugLogCategory } from '@/lib/debugLog';
import { CardType, GoodsType, INITIAL_TOKEN_VALUES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Play, SkipForward, Zap, Ship, Package, RefreshCw, Eye } from 'lucide-react';

// ── FPS Counter ─────────────────────────────────────────────────
function useFPS() {
  const [fps, setFps] = useState(0);
  const frameRef = useRef(0);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    let raf: number;
    const tick = (now: number) => {
      frameRef.current++;
      if (now - lastRef.current >= 1000) {
        setFps(frameRef.current);
        frameRef.current = 0;
        lastRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return fps;
}

// ── Category colors ─────────────────────────────────────────────
const catColors: Record<DebugLogCategory, string> = {
  rules: 'text-emerald-400',
  ads: 'text-amber-400',
  engine: 'text-blue-400',
  platform: 'text-purple-400',
};

const DebugPanel = () => {
  const navigate = useNavigate();
  const fps = useFPS();
  const gameState = useGameStore();
  const consent = useConsentStore();
  const remoteConfig = useRemoteConfigStore((s) => s.config);

  // Logs
  const [logs, setLogs] = useState<readonly DebugLogEntry[]>(getDebugLogs());
  const [filterCat, setFilterCat] = useState<DebugLogCategory | 'all'>('all');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeDebugLogs(() => setLogs([...getDebugLogs()]));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = filterCat === 'all' ? logs : logs.filter((l) => l.category === filterCat);

  // ── Quick actions ───────────────────────────────────────────
  const { startGame, resetGame } = useGameStore.getState();

  const handleReseedDeck = () => {
    // Start a fresh game with all rules enabled for testing
    startGame('Debug Captain', 'easy', { stormRule: true, pirateRaid: true, treasureChest: true });
  };

  const handleFillMarketWith = (type: CardType) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    const newMarket = state.market.map((c, i) => i < 3 ? { ...c, type } : c);
    useGameStore.setState({ market: newMarket });
  };

  const handleGrantCargo = (type: GoodsType) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    const player = state.players[0];
    if (player.hand.length >= 7) return;
    const newCard = { id: `debug-${Date.now()}`, type };
    const newPlayers = [...state.players];
    newPlayers[0] = { ...player, hand: [...player.hand, newCard] };
    useGameStore.setState({ players: newPlayers });
  };

  const handleForceEndRound = () => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    // Empty 3 token stacks to trigger round end
    const newStacks = { ...state.tokenStacks };
    const types = Object.keys(newStacks) as GoodsType[];
    for (let i = 0; i < 3 && i < types.length; i++) {
      newStacks[types[i]] = [];
    }
    useGameStore.setState({ tokenStacks: newStacks });
  };

  const handleForceStorm = () => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    // Set turn count to a multiple of 3 so next endTurn triggers storm
    const nextMultiple = Math.ceil((state.turnCount + 1) / 3) * 3;
    useGameStore.setState({ turnCount: nextMultiple - 1 });
  };

  const goodsTypes: GoodsType[] = ['rum', 'cannonballs', 'silks', 'silver', 'gold', 'gemstones'];

  // Gate: only in dev mode
  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Debug panel is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="font-pirate text-2xl text-primary">Debug Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* FPS */}
          <div className={`px-3 py-1 rounded-full text-xs font-mono border ${fps >= 50 ? 'border-emerald-500/30 text-emerald-400' : fps >= 30 ? 'border-amber-500/30 text-amber-400' : 'border-destructive/30 text-destructive'}`}>
            {fps} FPS
          </div>
          <span className="text-xs text-muted-foreground">
            Phase: <span className="text-foreground font-mono">{gameState.phase}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column: Actions ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Game Controls */}
          <section className="p-4 rounded-xl border border-border bg-card/50">
            <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Game Controls</h2>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleReseedDeck} className="justify-start gap-2">
                <RefreshCw className="w-4 h-4" /> New Game (all rules)
              </Button>
              <Button variant="outline" size="sm" onClick={resetGame} className="justify-start gap-2">
                <Trash2 className="w-4 h-4" /> Reset to Lobby
              </Button>
              <Button variant="outline" size="sm" onClick={handleForceEndRound} className="justify-start gap-2">
                <SkipForward className="w-4 h-4" /> Force End Round
              </Button>
              <Button variant="outline" size="sm" onClick={handleForceStorm} className="justify-start gap-2">
                <Zap className="w-4 h-4" /> Prime Storm
              </Button>
            </div>
          </section>

          {/* Fill Market */}
          <section className="p-4 rounded-xl border border-border bg-card/50">
            <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Fill Market With</h2>
            <div className="flex flex-wrap gap-2">
              {goodsTypes.map((type) => (
                <Button key={type} variant="outline" size="sm" onClick={() => handleFillMarketWith(type)} className="capitalize text-xs">
                  {type}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => handleFillMarketWith('ships')} className="text-xs">
                <Ship className="w-3 h-3 mr-1" /> Ships
              </Button>
            </div>
          </section>

          {/* Grant Cargo */}
          <section className="p-4 rounded-xl border border-border bg-card/50">
            <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Grant Cargo to Player 1</h2>
            <div className="flex flex-wrap gap-2">
              {goodsTypes.map((type) => (
                <Button key={type} variant="outline" size="sm" onClick={() => handleGrantCargo(type)} className="capitalize text-xs">
                  <Package className="w-3 h-3 mr-1" /> {type}
                </Button>
              ))}
            </div>
          </section>

          {/* State Snapshot */}
          <section className="p-4 rounded-xl border border-border bg-card/50">
            <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">State Snapshot</h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>Round: {gameState.round}/{gameState.maxRounds}</div>
              <div>Turn: {gameState.turnCount}</div>
              <div>Deck: {gameState.deck.length} cards</div>
              <div>Market: {gameState.market.length} cards</div>
              <div>Current Player: {gameState.players[gameState.currentPlayerIndex]?.name}</div>
              <div>Wins: [{gameState.roundWins.join(', ')}]</div>
              {gameState.players.map((p, i) => (
                <div key={p.id}>P{i + 1} Hand: {p.hand.length} | Ships: {p.ships.length} | Score: {calculateScore(p, gameState.players)}</div>
              ))}
              <div className="col-span-2 mt-2 pt-2 border-t border-border">
                <div>Empty stacks: {Object.values(gameState.tokenStacks).filter((s) => s.length === 0).length}</div>
                <div>Ads enabled: {String(isAdsRemoteEnabled())} | Consent ads: {String(consent.adsEnabled)}</div>
                <div>Remote config: {JSON.stringify(remoteConfig, null, 0).slice(0, 120)}…</div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right Column: Logs ───────────────────────────────── */}
        <div className="space-y-4">
          <section className="p-4 rounded-xl border border-border bg-card/50 flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Event Log</h2>
              <div className="flex items-center gap-2">
                {(['all', 'rules', 'ads', 'engine', 'platform'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${filterCat === cat ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
                <Button variant="ghost" size="sm" onClick={clearDebugLogs} className="h-6 px-2">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 min-h-[200px]">
              {filteredLogs.length === 0 && (
                <p className="text-muted-foreground/50 text-center py-8">No log entries yet. Start a game to see events.</p>
              )}
              {filteredLogs.map((entry) => (
                <div key={entry.id} className="flex gap-2 py-0.5 border-b border-border/30">
                  <span className="text-muted-foreground/60 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`shrink-0 w-14 ${catColors[entry.category]}`}>[{entry.category}]</span>
                  <span className="text-foreground">{entry.event}</span>
                  {entry.detail && <span className="text-muted-foreground">— {entry.detail}</span>}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
