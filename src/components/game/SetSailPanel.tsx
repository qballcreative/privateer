import { motion } from 'framer-motion';
import { Swords, Users, Anchor, Crown, Dices, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Difficulty } from '@/types/game';

interface SetSailPanelProps {
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
}

const difficultyLevels: { key: Difficulty; label: string; icon: typeof Shield }[] = [
  { key: 'easy', label: 'Cabin Boy', icon: Shield },
  { key: 'medium', label: 'First Mate', icon: Anchor },
  { key: 'hard', label: 'Dread Pirate', icon: Swords },
  { key: 'expert', label: 'Pirate Lord', icon: Crown },
];

export const SetSailPanel = ({
  mode, setMode, difficulty, onDifficultyChange,
  bestOf, setBestOf, firstPlayer, setFirstPlayer,
  onStartAAI, onCreateRoom, onJoinRoom, restrictedMode,
}: SetSailPanelProps) => {
  return (
    <motion.div
      className="relative max-w-lg mx-auto -mt-12 z-10 px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="rounded-lg rope-border bg-[hsl(var(--wood-plank)/0.85)] backdrop-blur-md p-6 md:p-8 shadow-[var(--shadow-inset),var(--shadow-elevated)]">
        {/* Title */}
        <h2 className="font-pirate text-3xl md:text-4xl text-primary text-center mb-6 drop-shadow-[0_0_10px_hsl(var(--gold)/0.3)]">
          Set Sail
        </h2>

        {/* Mode Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-0">
          <ModeButton
            active={mode === 'aai'}
            onClick={() => setMode('aai')}
            icon={<Swords className="w-6 h-6" />}
            label="Battle the AAI"
            variant="gold"
          />
          {!restrictedMode && (
            <ModeButton
              active={mode === 'multiplayer'}
              onClick={() => setMode('multiplayer')}
              icon={<Users className="w-6 h-6" />}
              label="Multiplayer"
              variant="ocean"
            />
          )}
        </div>

        <hr className="wood-separator my-5" />

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-0">
          {/* Best Of */}
          <OptionGroup label="Best of">
            <div className="flex gap-2">
              {([1, 3] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setBestOf(v)}
                  className={cn(
                    'flex-1 min-h-[44px] rounded-md font-bold text-sm transition-all',
                    bestOf === v
                      ? 'cargo-slot text-primary shadow-[inset_0_0_8px_hsl(var(--brass)/0.3)]'
                      : 'cargo-slot text-muted-foreground hover:text-primary/70'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </OptionGroup>

          {/* First Player */}
          <OptionGroup label="First Player">
            <div className="flex gap-2">
              {(['host', 'random'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFirstPlayer(v)}
                  className={cn(
                    'flex-1 min-h-[44px] rounded-md font-bold text-sm transition-all capitalize',
                    firstPlayer === v
                      ? 'cargo-slot text-primary shadow-[inset_0_0_8px_hsl(var(--brass)/0.3)]'
                      : 'cargo-slot text-muted-foreground hover:text-primary/70'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </OptionGroup>
        </div>

        {/* Pirate Level — AAI only */}
        {mode === 'aai' && (
          <>
            <hr className="wood-separator my-5" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Pirate Level</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {difficultyLevels.map(({ key, label, icon: Icon }) => {
                  const locked = restrictedMode && key !== 'easy';
                  return (
                    <button
                      key={key}
                      onClick={() => onDifficultyChange(key)}
                      disabled={locked}
                      className={cn(
                        'min-h-[44px] rounded-md p-2 transition-all flex flex-col items-center justify-center gap-1',
                        locked && 'opacity-40 cursor-not-allowed',
                        difficulty === key
                          ? 'cargo-slot text-primary shadow-[inset_0_0_8px_hsl(var(--brass)/0.3)]'
                          : 'cargo-slot text-muted-foreground hover:text-primary/70'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <hr className="wood-separator my-5" />

        {/* Action Buttons */}
        <div className="space-y-3">
          {mode === 'aai' ? (
            <ActionButton onClick={onStartAAI} variant="gold">
              <Swords className="w-6 h-6 mr-2" />
              Start vs AAI
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
    <p className="text-sm text-muted-foreground mb-2">{label}</p>
    {children}
  </div>
);

const ModeButton = ({
  active, onClick, icon, label, variant,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
  variant: 'gold' | 'ocean';
}) => (
  <button
    onClick={onClick}
    className={cn(
      'min-h-[56px] rounded-md p-4 flex items-center justify-center gap-3 font-pirate text-lg transition-all cargo-slot',
      active
        ? variant === 'gold'
          ? 'text-primary shadow-[inset_0_0_12px_hsl(var(--gold)/0.3),var(--shadow-gold)]'
          : 'text-accent shadow-[inset_0_0_12px_hsl(var(--ocean)/0.3),0_0_15px_hsl(var(--ocean)/0.3)]'
        : 'text-muted-foreground hover:text-primary/60'
    )}
  >
    {icon}
    {label}
  </button>
);

const ActionButton = ({
  onClick, variant, children,
}: {
  onClick: () => void; variant: 'gold' | 'ocean'; children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full min-h-[52px] rounded-md rope-border font-pirate text-lg flex items-center justify-center transition-all active:scale-95',
      variant === 'gold'
        ? 'bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[var(--shadow-gold)] hover:shadow-[0_6px_25px_hsl(var(--gold)/0.6)]'
        : 'bg-gradient-to-b from-accent to-accent/80 text-accent-foreground shadow-[0_4px_15px_hsl(var(--ocean)/0.3)] hover:shadow-[0_6px_25px_hsl(var(--ocean)/0.5)]'
    )}
  >
    {children}
  </button>
);
