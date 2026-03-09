import { motion } from 'framer-motion';
import { Users, Anchor, Trophy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Difficulty } from '@/types/game';
import { Input } from '@/components/ui/input';
import deckhandImg from '@/assets/difficulty/deckhand.png';
import bosunImg from '@/assets/difficulty/bosun.png';
import privateerImg from '@/assets/difficulty/privateer.png';
import admiralImg from '@/assets/difficulty/admiral.png';

interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
}

interface SetSailPanelProps {
  playerName: string;
  onNameChange: (name: string) => void;
  stats: PlayerStats;
  mode: 'aai' | 'multiplayer';
  setMode: (m: 'aai' | 'multiplayer') => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  bestOf: 1 | 3;
  setBestOf: (v: 1 | 3) => void;
  firstPlayer: 'host' | 'random';
  setFirstPlayer: (v: 'host' | 'random') => void;
  onStartAAI: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  restrictedMode: boolean;
  loading?: boolean;
}

const difficultyLevels: { key: Difficulty; label: string; img: string }[] = [
  { key: 'easy', label: 'Deckhand', img: deckhandImg },
  { key: 'medium', label: 'Bosun', img: bosunImg },
  { key: 'hard', label: 'Privateer', img: privateerImg },
  { key: 'expert', label: 'Admiral', img: admiralImg },
];

export const SetSailPanel = ({
  playerName, onNameChange, stats,
  mode, setMode, difficulty, onDifficultyChange,
  bestOf, setBestOf, firstPlayer, setFirstPlayer,
  onStartAAI, onCreateRoom, onJoinRoom, restrictedMode,
  loading = false,
}: SetSailPanelProps) => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <motion.div
      className="relative max-w-lg mx-auto z-10 px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="game-box-card p-6 md:p-8">
        {/* Title */}
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-center mb-6">
          Set Sail
        </h2>

        {/* Player Name */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Captain's Name</p>
          <Input
            value={playerName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name, Captain…"
            maxLength={20}
            className="bg-muted/30 border-border text-foreground"
          />
        </div>

        {/* Player Stats */}
        {stats.gamesPlayed > 0 && (
          <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
            <Trophy className="w-4 h-4 text-primary shrink-0" />
            <span>{stats.wins}W – {stats.losses}L</span>
            <span className="text-primary font-bold">{winRate}%</span>
            <span className="ml-auto">{stats.gamesPlayed} games</span>
          </div>
        )}

        {/* Mode Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-0">
          <ModeButton
            active={mode === 'aai'}
            onClick={() => setMode('aai')}
            label="Challenge AI"
            variant="gold"
          />
          {!restrictedMode && (
            <ModeButton
              active={mode === 'multiplayer'}
              onClick={() => setMode('multiplayer')}
              label="Challenge Player"
              variant="ocean"
            />
          )}
        </div>

        <hr className="my-5 border-border" />

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-0">
          <OptionGroup label="Best of">
            <div className="flex gap-2">
              {([1, 3] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setBestOf(v)}
                  className={cn(
                    'flex-1 min-h-[44px] rounded-lg font-bold text-sm transition-all border',
                    bestOf === v
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </OptionGroup>

          <OptionGroup label="First Player">
            <div className="flex gap-2">
              {(['host', 'random'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFirstPlayer(v)}
                  className={cn(
                    'flex-1 min-h-[44px] rounded-lg font-bold text-sm transition-all capitalize border',
                    firstPlayer === v
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </OptionGroup>
        </div>

        {/* Difficulty — AAI only */}
        {mode === 'aai' && (
          <>
            <hr className="my-5 border-border" />
            <div>
              <p className="text-sm text-muted-foreground mb-2 font-semibold">Difficulty</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {difficultyLevels.map(({ key, label, img }) => {
                  const locked = restrictedMode && key !== 'easy';
                  return (
                    <button
                      key={key}
                      onClick={() => onDifficultyChange(key)}
                      disabled={locked}
                      className={cn(
                        'min-h-[72px] rounded-lg p-2 transition-all flex flex-col items-center justify-center gap-1 border',
                        locked && 'opacity-40 cursor-not-allowed',
                        difficulty === key
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      )}
                    >
                      <img src={img} alt={label} className="w-10 h-10 object-contain" />
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <hr className="my-5 border-border" />

        {/* Action Buttons */}
        <div className="space-y-3">
          {mode === 'aai' ? (
            <ActionButton onClick={onStartAAI} variant="gold" loading={loading}>
              Start Game
            </ActionButton>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionButton onClick={onCreateRoom} variant="gold">
                <Anchor className="w-5 h-5 mr-2" />
                Create Room
              </ActionButton>
              <ActionButton onClick={onJoinRoom} variant="ocean">
                <Users className="w-5 h-5 mr-2" />
                Join Room
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const OptionGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm text-muted-foreground mb-2 font-semibold">{label}</p>
    {children}
  </div>
);

const ModeButton = ({
  active, onClick, label, variant,
}: {
  active: boolean; onClick: () => void; label: string;
  variant: 'gold' | 'ocean';
}) => (
  <button
    onClick={onClick}
    className={cn(
      'min-h-[56px] rounded-lg p-4 flex items-center justify-center font-bold text-base transition-all border',
      active
        ? variant === 'gold'
          ? 'bg-primary/10 border-primary text-primary shadow-[0_0_12px_hsl(var(--gold)/0.15)]'
          : 'bg-accent/10 border-accent text-accent shadow-[0_0_12px_hsl(var(--ocean)/0.15)]'
        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
    )}
  >
    {label}
  </button>
);

const ActionButton = ({
  onClick, variant, children, loading = false,
}: {
  onClick: () => void; variant: 'gold' | 'ocean'; children: React.ReactNode; loading?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={cn(
      'w-full min-h-[52px] rounded-lg font-bold text-lg flex items-center justify-center transition-all active:scale-95',
      loading && 'opacity-80 cursor-not-allowed',
      variant === 'gold'
        ? 'bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0_4px_15px_hsl(var(--gold)/0.3)] hover:shadow-[0_6px_25px_hsl(var(--gold)/0.5)]'
        : 'bg-gradient-to-b from-accent to-accent/80 text-accent-foreground shadow-[0_4px_15px_hsl(var(--ocean)/0.3)] hover:shadow-[0_6px_25px_hsl(var(--ocean)/0.5)]'
    )}
  >
    {loading ? (
      <Loader2 className="w-6 h-6 animate-spin" />
    ) : (
      children
    )}
  </button>
);
