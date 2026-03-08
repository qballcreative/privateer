import { motion } from 'framer-motion';
import { Card, CardType } from '@/types/game';
import { cn } from '@/lib/utils';

interface CargoObjectProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  enableLayoutId?: boolean;
}

/* ─── Size tiers ─── */
const sizeConfig = {
  sm: { scale: 0.6, w: 80, h: 70 },
  md: { scale: 0.85, w: 80, h: 70 },
  lg: { scale: 1.1, w: 80, h: 70 },
};

const shadow = {
  rest: '0 4px 10px -2px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.3)',
  lift: '0 10px 24px -4px rgba(0,0,0,0.65), 0 6px 10px rgba(0,0,0,0.35)',
};

/* ─── Per-type SVG renderers ─── */

const RumBarrel = () => (
  <svg viewBox="0 0 64 72" className="w-full h-full">
    <defs>
      <linearGradient id="barrel-wood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(25, 60%, 38%)" />
        <stop offset="50%" stopColor="hsl(25, 55%, 28%)" />
        <stop offset="100%" stopColor="hsl(25, 50%, 20%)" />
      </linearGradient>
      <linearGradient id="barrel-highlight" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="hsla(0,0%,100%,0.15)" />
        <stop offset="40%" stopColor="hsla(0,0%,100%,0)" />
      </linearGradient>
    </defs>
    {/* Barrel body */}
    <rect x="10" y="8" width="44" height="56" rx="10" fill="url(#barrel-wood)" stroke="hsl(25,40%,18%)" strokeWidth="1.5" />
    {/* Wood planks */}
    <line x1="14" y1="24" x2="50" y2="24" stroke="hsl(25,30%,16%)" strokeWidth="0.8" opacity="0.5" />
    <line x1="14" y1="40" x2="50" y2="40" stroke="hsl(25,30%,16%)" strokeWidth="0.8" opacity="0.5" />
    <line x1="14" y1="48" x2="50" y2="48" stroke="hsl(25,30%,16%)" strokeWidth="0.8" opacity="0.5" />
    {/* Metal bands */}
    <rect x="8" y="16" width="48" height="5" rx="2" fill="hsl(25,20%,14%)" opacity="0.8" />
    <rect x="8" y="52" width="48" height="5" rx="2" fill="hsl(25,20%,14%)" opacity="0.8" />
    {/* Band rivets */}
    <circle cx="14" cy="18.5" r="1.5" fill="hsl(40,50%,50%)" />
    <circle cx="50" cy="18.5" r="1.5" fill="hsl(40,50%,50%)" />
    <circle cx="14" cy="54.5" r="1.5" fill="hsl(40,50%,50%)" />
    <circle cx="50" cy="54.5" r="1.5" fill="hsl(40,50%,50%)" />
    {/* XXX text */}
    <text x="32" y="38" textAnchor="middle" fontSize="12" fontWeight="bold" fill="hsl(40,80%,65%)" fontFamily="serif" letterSpacing="2">XXX</text>
    {/* Highlight */}
    <rect x="10" y="8" width="44" height="56" rx="10" fill="url(#barrel-highlight)" />
  </svg>
);

const Cannonballs = () => (
  <svg viewBox="0 0 72 64" className="w-full h-full">
    <defs>
      <radialGradient id="iron-ball" cx="0.35" cy="0.3" r="0.65">
        <stop offset="0%" stopColor="hsl(210,12%,55%)" />
        <stop offset="60%" stopColor="hsl(210,10%,32%)" />
        <stop offset="100%" stopColor="hsl(210,12%,18%)" />
      </radialGradient>
    </defs>
    {/* Wooden base */}
    <rect x="10" y="48" width="52" height="10" rx="3" fill="hsl(30,35%,28%)" stroke="hsl(30,25%,18%)" strokeWidth="1" />
    <line x1="14" y1="53" x2="58" y2="53" stroke="hsl(30,25%,20%)" strokeWidth="0.6" opacity="0.5" />
    {/* Bottom row - 2 balls */}
    <circle cx="26" cy="40" r="13" fill="url(#iron-ball)" stroke="hsl(210,8%,15%)" strokeWidth="1" />
    <circle cx="46" cy="40" r="13" fill="url(#iron-ball)" stroke="hsl(210,8%,15%)" strokeWidth="1" />
    {/* Top ball */}
    <circle cx="36" cy="22" r="13" fill="url(#iron-ball)" stroke="hsl(210,8%,15%)" strokeWidth="1" />
    {/* Specular highlights */}
    <circle cx="22" cy="34" r="3" fill="hsla(210,15%,75%,0.4)" />
    <circle cx="42" cy="34" r="3" fill="hsla(210,15%,75%,0.4)" />
    <circle cx="32" cy="16" r="3" fill="hsla(210,15%,75%,0.4)" />
  </svg>
);

const SilverBars = () => (
  <svg viewBox="0 0 76 60" className="w-full h-full">
    <defs>
      <linearGradient id="silver-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(210,12%,78%)" />
        <stop offset="40%" stopColor="hsl(210,10%,62%)" />
        <stop offset="100%" stopColor="hsl(210,8%,45%)" />
      </linearGradient>
      <linearGradient id="silver-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(210,8%,50%)" />
        <stop offset="100%" stopColor="hsl(210,10%,35%)" />
      </linearGradient>
    </defs>
    {/* Bottom bar */}
    <polygon points="8,50 24,42 68,42 52,50" fill="url(#silver-side)" stroke="hsl(210,8%,30%)" strokeWidth="0.8" />
    <polygon points="24,42 68,42 68,34 24,34" fill="url(#silver-bar)" stroke="hsl(210,8%,38%)" strokeWidth="0.8" />
    <polygon points="8,50 24,42 24,34 8,42" fill="hsl(210,8%,40%)" stroke="hsl(210,8%,30%)" strokeWidth="0.8" />
    {/* Top bar (offset) */}
    <polygon points="16,40 32,32 66,32 50,40" fill="url(#silver-side)" stroke="hsl(210,8%,30%)" strokeWidth="0.8" />
    <polygon points="32,32 66,32 66,24 32,24" fill="url(#silver-bar)" stroke="hsl(210,8%,38%)" strokeWidth="0.8" />
    <polygon points="16,40 32,32 32,24 16,32" fill="hsl(210,8%,40%)" stroke="hsl(210,8%,30%)" strokeWidth="0.8" />
    {/* Third bar on top */}
    <polygon points="22,30 38,22 62,22 46,30" fill="url(#silver-side)" stroke="hsl(210,8%,30%)" strokeWidth="0.8" />
    <polygon points="38,22 62,22 62,14 38,14" fill="url(#silver-bar)" stroke="hsl(210,8%,38%)" strokeWidth="0.8" />
    <polygon points="22,30 38,22 38,14 22,22" fill="hsl(210,8%,40%)" stroke="hsl(210,8%,30%)" strokeWidth="0.8" />
    {/* Specular shine */}
    <rect x="40" y="15" width="16" height="3" rx="1" fill="hsla(0,0%,100%,0.25)" />
    <rect x="34" y="25" width="20" height="3" rx="1" fill="hsla(0,0%,100%,0.2)" />
    {/* Stamp on top bar */}
    <text x="50" y="20" textAnchor="middle" fontSize="6" fill="hsl(210,8%,35%)" fontWeight="bold">Ag</text>
  </svg>
);

const GoldBars = () => (
  <svg viewBox="0 0 76 60" className="w-full h-full">
    <defs>
      <linearGradient id="gold-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(43,90%,68%)" />
        <stop offset="40%" stopColor="hsl(43,80%,52%)" />
        <stop offset="100%" stopColor="hsl(43,70%,38%)" />
      </linearGradient>
      <linearGradient id="gold-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(43,70%,42%)" />
        <stop offset="100%" stopColor="hsl(43,60%,28%)" />
      </linearGradient>
    </defs>
    {/* Bottom bar */}
    <polygon points="8,50 24,42 68,42 52,50" fill="url(#gold-side)" stroke="hsl(43,50%,25%)" strokeWidth="0.8" />
    <polygon points="24,42 68,42 68,34 24,34" fill="url(#gold-bar)" stroke="hsl(43,60%,35%)" strokeWidth="0.8" />
    <polygon points="8,50 24,42 24,34 8,42" fill="hsl(43,60%,35%)" stroke="hsl(43,50%,25%)" strokeWidth="0.8" />
    {/* Top bar */}
    <polygon points="16,40 32,32 66,32 50,40" fill="url(#gold-side)" stroke="hsl(43,50%,25%)" strokeWidth="0.8" />
    <polygon points="32,32 66,32 66,24 32,24" fill="url(#gold-bar)" stroke="hsl(43,60%,35%)" strokeWidth="0.8" />
    <polygon points="16,40 32,32 32,24 16,32" fill="hsl(43,60%,35%)" stroke="hsl(43,50%,25%)" strokeWidth="0.8" />
    {/* Third bar */}
    <polygon points="22,30 38,22 62,22 46,30" fill="url(#gold-side)" stroke="hsl(43,50%,25%)" strokeWidth="0.8" />
    <polygon points="38,22 62,22 62,14 38,14" fill="url(#gold-bar)" stroke="hsl(43,60%,35%)" strokeWidth="0.8" />
    <polygon points="22,30 38,22 38,14 22,22" fill="hsl(43,60%,35%)" stroke="hsl(43,50%,25%)" strokeWidth="0.8" />
    {/* Shine */}
    <rect x="40" y="15" width="16" height="3" rx="1" fill="hsla(0,0%,100%,0.35)" />
    <rect x="34" y="25" width="20" height="3" rx="1" fill="hsla(0,0%,100%,0.25)" />
    {/* Stamp */}
    <text x="50" y="20" textAnchor="middle" fontSize="6" fill="hsl(43,50%,30%)" fontWeight="bold">Au</text>
  </svg>
);

const Gemstones = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="gem-face" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="hsl(155,65%,55%)" />
        <stop offset="50%" stopColor="hsl(155,55%,38%)" />
        <stop offset="100%" stopColor="hsl(155,50%,22%)" />
      </linearGradient>
      <linearGradient id="gem-light" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="hsla(155,80%,75%,0.6)" />
        <stop offset="100%" stopColor="hsla(155,60%,40%,0)" />
      </linearGradient>
    </defs>
    {/* Gem crown (top facets) */}
    <polygon points="32,6 52,22 44,28 32,24 20,28 12,22" fill="url(#gem-face)" stroke="hsl(155,40%,30%)" strokeWidth="1" />
    {/* Gem table (flat top) */}
    <polygon points="20,28 44,28 32,24" fill="hsl(155,60%,48%)" stroke="hsl(155,40%,30%)" strokeWidth="0.5" />
    {/* Left crown facet */}
    <polygon points="32,6 12,22 20,28 32,24" fill="hsl(155,50%,42%)" stroke="hsl(155,40%,30%)" strokeWidth="0.5" />
    {/* Right crown facet */}
    <polygon points="32,6 52,22 44,28 32,24" fill="hsl(155,55%,35%)" stroke="hsl(155,40%,30%)" strokeWidth="0.5" />
    {/* Pavilion (bottom) */}
    <polygon points="12,22 32,58 20,28" fill="hsl(155,45%,28%)" stroke="hsl(155,40%,22%)" strokeWidth="0.8" />
    <polygon points="52,22 32,58 44,28" fill="hsl(155,40%,24%)" stroke="hsl(155,40%,22%)" strokeWidth="0.8" />
    <polygon points="20,28 32,58 44,28" fill="hsl(155,50%,30%)" stroke="hsl(155,40%,22%)" strokeWidth="0.8" />
    {/* Internal facet lines */}
    <line x1="32" y1="24" x2="32" y2="58" stroke="hsl(155,40%,22%)" strokeWidth="0.5" opacity="0.6" />
    <line x1="20" y1="28" x2="32" y2="58" stroke="hsl(155,40%,22%)" strokeWidth="0.4" opacity="0.4" />
    <line x1="44" y1="28" x2="32" y2="58" stroke="hsl(155,40%,22%)" strokeWidth="0.4" opacity="0.4" />
    {/* Sparkle highlight */}
    <polygon points="32,24 28,20 32,16 36,20" fill="hsla(0,0%,100%,0.7)" />
    <circle cx="24" cy="18" r="1.5" fill="hsla(0,0%,100%,0.5)" />
    {/* Light overlay */}
    <polygon points="32,6 52,22 44,28 32,24 20,28 12,22" fill="url(#gem-light)" />
  </svg>
);

const Silks = () => (
  <svg viewBox="0 0 70 60" className="w-full h-full">
    <defs>
      <linearGradient id="silk-fabric" x1="0" y1="0" x2="1" y2="0.5">
        <stop offset="0%" stopColor="hsl(280,55%,50%)" />
        <stop offset="30%" stopColor="hsl(280,50%,38%)" />
        <stop offset="60%" stopColor="hsl(280,55%,48%)" />
        <stop offset="100%" stopColor="hsl(280,45%,32%)" />
      </linearGradient>
      <linearGradient id="silk-sheen" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="hsla(280,80%,75%,0.3)" />
        <stop offset="100%" stopColor="hsla(280,60%,40%,0)" />
      </linearGradient>
    </defs>
    {/* Roll body */}
    <ellipse cx="35" cy="48" rx="28" ry="8" fill="hsl(280,40%,25%)" />
    <rect x="7" y="16" width="56" height="32" rx="4" fill="url(#silk-fabric)" stroke="hsl(280,35%,25%)" strokeWidth="1" />
    <ellipse cx="35" cy="16" rx="28" ry="8" fill="hsl(280,50%,45%)" stroke="hsl(280,35%,30%)" strokeWidth="1" />
    {/* Fold lines */}
    <path d="M12,24 Q25,28 38,24 Q50,20 58,24" fill="none" stroke="hsl(280,60%,55%)" strokeWidth="0.8" opacity="0.4" />
    <path d="M12,32 Q28,36 42,32 Q54,28 58,32" fill="none" stroke="hsl(280,60%,55%)" strokeWidth="0.8" opacity="0.3" />
    <path d="M12,40 Q22,44 35,40 Q48,36 58,40" fill="none" stroke="hsl(280,60%,55%)" strokeWidth="0.8" opacity="0.25" />
    {/* Sheen */}
    <rect x="7" y="16" width="56" height="32" rx="4" fill="url(#silk-sheen)" />
    {/* Gold thread accent */}
    <line x1="20" y1="14" x2="50" y2="14" stroke="hsl(43,70%,55%)" strokeWidth="1.2" opacity="0.6" />
    <line x1="20" y1="18" x2="50" y2="18" stroke="hsl(43,70%,55%)" strokeWidth="0.8" opacity="0.4" />
    {/* Label */}
    <text x="35" y="36" textAnchor="middle" fontSize="8" fill="hsl(280,60%,72%)" fontFamily="serif" fontStyle="italic" opacity="0.7">Silk</text>
  </svg>
);

const Ship = () => (
  <svg viewBox="0 0 72 68" className="w-full h-full">
    <defs>
      <linearGradient id="hull-grad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="hsl(25,50%,35%)" />
        <stop offset="100%" stopColor="hsl(25,45%,20%)" />
      </linearGradient>
      <linearGradient id="sail-grad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="hsl(40,30%,88%)" />
        <stop offset="100%" stopColor="hsl(40,25%,72%)" />
      </linearGradient>
    </defs>
    {/* Water line */}
    <path d="M4,58 Q18,62 36,58 Q54,54 68,58" fill="none" stroke="hsl(200,50%,45%)" strokeWidth="1.5" opacity="0.5" />
    {/* Hull */}
    <path d="M10,52 L16,42 L56,42 L62,52 Q36,56 10,52Z" fill="url(#hull-grad)" stroke="hsl(25,40%,16%)" strokeWidth="1.2" />
    {/* Hull planks */}
    <line x1="18" y1="46" x2="54" y2="46" stroke="hsl(25,30%,18%)" strokeWidth="0.6" opacity="0.5" />
    <line x1="16" y1="50" x2="56" y2="50" stroke="hsl(25,30%,18%)" strokeWidth="0.6" opacity="0.5" />
    {/* Mast */}
    <line x1="36" y1="42" x2="36" y2="8" stroke="hsl(30,30%,28%)" strokeWidth="2.5" />
    {/* Main sail */}
    <path d="M38,12 Q50,22 38,36" fill="url(#sail-grad)" stroke="hsl(40,20%,60%)" strokeWidth="0.8" />
    {/* Fore sail */}
    <path d="M34,14 Q22,22 34,34" fill="url(#sail-grad)" stroke="hsl(40,20%,60%)" strokeWidth="0.8" />
    {/* Crow's nest */}
    <rect x="33" y="6" width="6" height="4" rx="1" fill="hsl(30,30%,25%)" />
    {/* Flag */}
    <path d="M36,6 L36,2 L46,4Z" fill="hsl(0,65%,45%)" />
    {/* Porthole */}
    <circle cx="28" cy="46" r="2" fill="hsl(40,60%,55%)" stroke="hsl(25,30%,18%)" strokeWidth="0.6" />
    <circle cx="44" cy="46" r="2" fill="hsl(40,60%,55%)" stroke="hsl(25,30%,18%)" strokeWidth="0.6" />
  </svg>
);

const Crate = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="crate-wood" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="hsl(30,40%,38%)" />
        <stop offset="100%" stopColor="hsl(30,35%,24%)" />
      </linearGradient>
    </defs>
    {/* Crate body */}
    <rect x="8" y="8" width="48" height="48" rx="3" fill="url(#crate-wood)" stroke="hsl(30,30%,18%)" strokeWidth="1.5" />
    {/* Horizontal planks */}
    <line x1="8" y1="20" x2="56" y2="20" stroke="hsl(30,25%,16%)" strokeWidth="1" />
    <line x1="8" y1="32" x2="56" y2="32" stroke="hsl(30,25%,16%)" strokeWidth="1" />
    <line x1="8" y1="44" x2="56" y2="44" stroke="hsl(30,25%,16%)" strokeWidth="1" />
    {/* Cross braces */}
    <line x1="10" y1="10" x2="54" y2="54" stroke="hsl(30,20%,20%)" strokeWidth="2.5" opacity="0.6" />
    <line x1="54" y1="10" x2="10" y2="54" stroke="hsl(30,20%,20%)" strokeWidth="2.5" opacity="0.6" />
    {/* Corner nails */}
    <circle cx="14" cy="14" r="2" fill="hsl(40,40%,50%)" />
    <circle cx="50" cy="14" r="2" fill="hsl(40,40%,50%)" />
    <circle cx="14" cy="50" r="2" fill="hsl(40,40%,50%)" />
    <circle cx="50" cy="50" r="2" fill="hsl(40,40%,50%)" />
    {/* Center nail */}
    <circle cx="32" cy="32" r="2.5" fill="hsl(40,40%,45%)" />
    {/* Top highlight */}
    <rect x="8" y="8" width="48" height="48" rx="3" fill="linear-gradient(180deg, hsla(0,0%,100%,0.1) 0%, transparent 30%)" opacity="0.6" />
    {/* Question mark */}
    <text x="32" y="36" textAnchor="middle" fontSize="14" fill="hsl(30,20%,50%)" fontWeight="bold" opacity="0.4">?</text>
  </svg>
);

/* ─── Renderer map ─── */
const renderers: Record<CardType, () => JSX.Element> = {
  rum: RumBarrel,
  cannonballs: Cannonballs,
  silver: SilverBars,
  gold: GoldBars,
  gemstones: Gemstones,
  silks: Silks,
  ships: Ship,
};

const labels: Record<CardType, string> = {
  rum: 'Rum',
  cannonballs: 'Iron',
  silver: 'Silver',
  gold: 'Gold',
  gemstones: 'Gems',
  silks: 'Silk',
  ships: 'Ship',
};

/* ─── Main Component ─── */
export const CargoObject = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  hidden = false,
  size = 'md',
  className,
  enableLayoutId = false,
}: CargoObjectProps) => {
  const { scale } = sizeConfig[size];
  const layoutProps = enableLayoutId ? { layoutId: `cargo-${card.id}` } : {};

  const Renderer = hidden ? Crate : renderers[card.type];
  const label = hidden ? 'Cargo' : labels[card.type];

  return (
    <motion.div
      {...layoutProps}
      className={cn(
        'relative cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        width: `${Math.round(80 * scale)}px`,
        height: `${Math.round(74 * scale)}px`,
      }}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : {
        scale: 1.08,
        y: -4,
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={{
        y: selected ? -8 : 0,
        filter: selected
          ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.5)) drop-shadow(0 0 12px hsla(43, 80%, 60%, 0.6))'
          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* SVG illustration */}
      <Renderer />

      {/* Label beneath */}
      <div className="absolute -bottom-1 inset-x-0 flex justify-center pointer-events-none">
        <span
          className="text-[7px] font-bold tracking-wider uppercase px-1 rounded"
          style={{
            color: 'hsl(40, 30%, 80%)',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            backgroundColor: 'hsla(0,0%,0%,0.4)',
          }}
        >
          {label}
        </span>
      </div>

      {/* Selection ring */}
      {selected && (
        <motion.div
          className="absolute -inset-1 rounded-lg pointer-events-none"
          style={{
            border: '2px solid hsl(43, 80%, 60%)',
            boxShadow: '0 0 12px 3px hsla(43, 80%, 60%, 0.5)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0.7, 1, 0.7], scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};
