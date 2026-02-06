import { motion } from 'framer-motion';
import { Card, CardType } from '@/types/game';
import { cn } from '@/lib/utils';
import { Wine, CircleDot, Shirt, Coins, Gem, Anchor, Package } from 'lucide-react';

interface CargoObjectProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Cargo configuration - each type has distinct visual identity
const cargoConfig: Record<CardType, {
  icon: React.ElementType;
  label: string;
  labelShort: string;
  containerClass: string;
  iconClass: string;
  accentClass: string;
}> = {
  rum: {
    icon: Wine,
    label: 'Rum Barrel',
    labelShort: 'Rum',
    containerClass: 'from-amber-800 to-amber-950 border-amber-700',
    iconClass: 'text-amber-300',
    accentClass: 'bg-amber-600/30',
  },
  cannonballs: {
    icon: CircleDot,
    label: 'Cannonballs',
    labelShort: 'Iron',
    containerClass: 'from-slate-600 to-slate-800 border-slate-500',
    iconClass: 'text-slate-300',
    accentClass: 'bg-slate-500/30',
  },
  silks: {
    icon: Shirt,
    label: 'Silk Bales',
    labelShort: 'Silk',
    containerClass: 'from-purple-700 to-purple-900 border-purple-500',
    iconClass: 'text-purple-300',
    accentClass: 'bg-purple-500/30',
  },
  silver: {
    icon: Coins,
    label: 'Silver Strongbox',
    labelShort: 'Silver',
    containerClass: 'from-gray-400 to-gray-600 border-gray-300',
    iconClass: 'text-gray-100',
    accentClass: 'bg-gray-300/30',
  },
  gold: {
    icon: Coins,
    label: 'Gold Chest',
    labelShort: 'Gold',
    containerClass: 'from-yellow-500 to-yellow-700 border-yellow-400',
    iconClass: 'text-yellow-200',
    accentClass: 'bg-yellow-400/30',
  },
  gemstones: {
    icon: Gem,
    label: 'Jewel Case',
    labelShort: 'Gems',
    containerClass: 'from-emerald-600 to-emerald-800 border-emerald-400',
    iconClass: 'text-emerald-300',
    accentClass: 'bg-emerald-400/30',
  },
  ships: {
    icon: Anchor,
    label: 'Ship Model',
    labelShort: 'Ship',
    containerClass: 'from-cyan-700 to-cyan-900 border-cyan-500',
    iconClass: 'text-cyan-300',
    accentClass: 'bg-cyan-500/30',
  },
};

const sizeConfig = {
  sm: {
    container: 'w-14 h-16',
    icon: 'w-5 h-5',
    label: 'text-[8px]',
    plate: 'px-1 py-0.5',
  },
  md: {
    container: 'w-20 h-24',
    icon: 'w-7 h-7',
    label: 'text-[10px]',
    plate: 'px-1.5 py-0.5',
  },
  lg: {
    container: 'w-24 h-28',
    icon: 'w-9 h-9',
    label: 'text-xs',
    plate: 'px-2 py-1',
  },
};

export const CargoObject = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  hidden = false,
  size = 'md',
  className,
}: CargoObjectProps) => {
  const config = cargoConfig[card.type];
  const sizes = sizeConfig[size];
  const IconComponent = config.icon;

  // Hidden cargo (opponent's cargo) shows as covered crate
  if (hidden) {
    return (
      <motion.div
        className={cn(
          sizes.container,
          'relative cursor-pointer select-none',
          'rounded-lg cargo-crate',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={disabled ? undefined : onClick}
        whileHover={disabled ? {} : { scale: 1.05, y: -3 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
      >
        {/* Tarp cover effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-secondary to-secondary/80 border-2 border-border">
          {/* Rope bindings */}
          <div className="absolute inset-x-2 top-1/3 h-0.5 bg-muted-foreground/40" />
          <div className="absolute inset-x-2 bottom-1/3 h-0.5 bg-muted-foreground/40" />
          <div className="absolute inset-y-2 left-1/3 w-0.5 bg-muted-foreground/40" />
          <div className="absolute inset-y-2 right-1/3 w-0.5 bg-muted-foreground/40" />
        </div>
        
        {/* Mystery indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className={cn(sizes.icon, 'text-muted-foreground/50')} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        sizes.container,
        'relative cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05, y: -5 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={{
        y: selected ? -8 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Cargo container (crate/barrel/chest base) */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg border-2 overflow-hidden',
          'bg-gradient-to-b shadow-lg',
          config.containerClass,
          selected && 'ring-2 ring-primary shadow-[0_0_15px_hsl(var(--gold)/0.6)]'
        )}
      >
        {/* Wood grain/texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
        
        {/* Metal corner fittings */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t-2 border-l-2 border-primary/40 rounded-tl" />
        <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t-2 border-r-2 border-primary/40 rounded-tr" />
        <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b-2 border-l-2 border-primary/40 rounded-bl" />
        <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b-2 border-r-2 border-primary/40 rounded-br" />

        {/* Icon container - simulates cargo visible through opening */}
        <div className={cn(
          'absolute top-1/4 inset-x-2 h-1/2 rounded flex items-center justify-center',
          config.accentClass
        )}>
          <IconComponent className={cn(sizes.icon, config.iconClass, 'drop-shadow-md')} />
        </div>

        {/* Brass label plate at bottom */}
        <div className={cn(
          'absolute bottom-1 inset-x-1 brass-plate rounded-sm flex items-center justify-center',
          sizes.plate
        )}>
          <span className={cn(
            'font-bold text-amber-950 uppercase tracking-wide',
            sizes.label
          )}>
            {config.labelShort}
          </span>
        </div>

        {/* Selection glow effect */}
        {selected && (
          <motion.div
            className="absolute inset-0 bg-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Lift shadow when selected */}
      {selected && (
        <div className="absolute -bottom-1 inset-x-1 h-2 bg-background/50 rounded-full blur-sm" />
      )}
    </motion.div>
  );
};
