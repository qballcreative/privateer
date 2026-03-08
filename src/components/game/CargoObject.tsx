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
  enableLayoutId?: boolean;
}

// Each cargo type as a distinct physical token
const cargoConfig: Record<CardType, {
  icon: React.ElementType;
  label: string;
  labelShort: string;
  bgFrom: string;
  bgTo: string;
  borderColor: string;
  iconColor: string;
  ringGlow: string;
}> = {
  rum: {
    icon: Wine,
    label: 'Rum Barrel',
    labelShort: 'RUM',
    bgFrom: 'hsl(25, 70%, 28%)',
    bgTo: 'hsl(25, 60%, 18%)',
    borderColor: 'hsl(25, 50%, 40%)',
    iconColor: 'hsl(40, 90%, 65%)',
    ringGlow: 'hsla(25, 80%, 50%, 0.4)',
  },
  cannonballs: {
    icon: CircleDot,
    label: 'Cannonballs',
    labelShort: 'IRON',
    bgFrom: 'hsl(210, 10%, 35%)',
    bgTo: 'hsl(210, 12%, 22%)',
    borderColor: 'hsl(210, 8%, 50%)',
    iconColor: 'hsl(210, 15%, 75%)',
    ringGlow: 'hsla(210, 15%, 50%, 0.4)',
  },
  silks: {
    icon: Shirt,
    label: 'Silk Bales',
    labelShort: 'SILK',
    bgFrom: 'hsl(280, 50%, 35%)',
    bgTo: 'hsl(280, 45%, 22%)',
    borderColor: 'hsl(280, 40%, 50%)',
    iconColor: 'hsl(280, 60%, 75%)',
    ringGlow: 'hsla(280, 50%, 50%, 0.4)',
  },
  silver: {
    icon: Coins,
    label: 'Silver Strongbox',
    labelShort: 'SILVER',
    bgFrom: 'hsl(210, 8%, 55%)',
    bgTo: 'hsl(210, 10%, 38%)',
    borderColor: 'hsl(210, 10%, 65%)',
    iconColor: 'hsl(210, 15%, 88%)',
    ringGlow: 'hsla(210, 15%, 65%, 0.4)',
  },
  gold: {
    icon: Coins,
    label: 'Gold Chest',
    labelShort: 'GOLD',
    bgFrom: 'hsl(43, 80%, 45%)',
    bgTo: 'hsl(43, 70%, 30%)',
    borderColor: 'hsl(43, 70%, 55%)',
    iconColor: 'hsl(43, 90%, 80%)',
    ringGlow: 'hsla(43, 80%, 50%, 0.5)',
  },
  gemstones: {
    icon: Gem,
    label: 'Jewel Case',
    labelShort: 'GEMS',
    bgFrom: 'hsl(155, 50%, 32%)',
    bgTo: 'hsl(155, 45%, 20%)',
    borderColor: 'hsl(155, 40%, 48%)',
    iconColor: 'hsl(155, 60%, 70%)',
    ringGlow: 'hsla(155, 50%, 45%, 0.4)',
  },
  ships: {
    icon: Anchor,
    label: 'Ship Model',
    labelShort: 'SHIP',
    bgFrom: 'hsl(195, 60%, 32%)',
    bgTo: 'hsl(195, 55%, 20%)',
    borderColor: 'hsl(195, 50%, 48%)',
    iconColor: 'hsl(195, 70%, 70%)',
    ringGlow: 'hsla(195, 60%, 45%, 0.4)',
  },
};

const sizeConfig = {
  sm: {
    outer: 'w-12 h-12',
    icon: 'w-5 h-5',
    label: 'text-[7px]',
    borderW: '2px',
    shadow: '0 3px 6px -1px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
    liftShadow: '0 6px 14px -2px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.35)',
  },
  md: {
    outer: 'w-16 h-16',
    icon: 'w-7 h-7',
    label: 'text-[8px]',
    borderW: '3px',
    shadow: '0 4px 10px -2px rgba(0,0,0,0.55), 0 2px 5px rgba(0,0,0,0.3)',
    liftShadow: '0 10px 22px -4px rgba(0,0,0,0.65), 0 5px 10px rgba(0,0,0,0.35)',
  },
  lg: {
    outer: 'w-20 h-20',
    icon: 'w-9 h-9',
    label: 'text-[9px]',
    borderW: '3px',
    shadow: '0 5px 14px -3px rgba(0,0,0,0.55), 0 3px 7px rgba(0,0,0,0.3)',
    liftShadow: '0 14px 30px -6px rgba(0,0,0,0.65), 0 7px 14px rgba(0,0,0,0.35)',
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
  enableLayoutId = false,
}: CargoObjectProps) => {
  const config = cargoConfig[card.type];
  const sizes = sizeConfig[size];
  const IconComponent = config.icon;
  const layoutProps = enableLayoutId ? { layoutId: `cargo-${card.id}` } : {};

  // Hidden cargo (opponent's hold) — sealed barrel token
  if (hidden) {
    return (
      <motion.div
        {...layoutProps}
        className={cn(
          sizes.outer,
          'relative cursor-default select-none rounded-full',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(25, 30%, 28%) 0%, hsl(25, 35%, 18%) 100%)',
          border: `${sizes.borderW} solid hsl(25, 25%, 38%)`,
          boxShadow: `${sizes.shadow}, inset 0 1px 0 hsla(25, 30%, 45%, 0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`,
        }}
        onClick={disabled ? undefined : onClick}
        whileHover={disabled ? {} : { scale: 1.05, boxShadow: sizes.liftShadow }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Cross-rope pattern */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[hsl(var(--rope))]" />
          <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-[hsl(var(--rope))]" />
        </div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className={cn(sizes.icon, 'text-[hsl(var(--rope))] opacity-50')} />
        </div>
        {/* Rim highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, hsla(0,0%,100%,0.08) 0%, transparent 40%, hsla(0,0%,0%,0.15) 100%)',
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      {...layoutProps}
      className={cn(
        sizes.outer,
        'relative cursor-pointer select-none rounded-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : {
        scale: 1.08,
        y: -4,
        boxShadow: `${sizes.liftShadow}, 0 0 16px 3px ${config.ringGlow}`,
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={{
        y: selected ? -8 : 0,
        boxShadow: selected
          ? `${sizes.liftShadow}, 0 0 20px 5px hsla(43, 80%, 60%, 0.6)`
          : sizes.shadow,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        background: `linear-gradient(180deg, ${config.bgFrom} 0%, ${config.bgTo} 100%)`,
        border: `${sizes.borderW} solid ${config.borderColor}`,
        boxShadow: sizes.shadow,
      }}
    >
      {/* Inner rim — 3D depth ring */}
      <div
        className="absolute inset-[3px] rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.08)`,
        }}
      />

      {/* Specular highlight — top arc */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, hsla(0,0%,100%,0.15) 0%, transparent 35%, hsla(0,0%,0%,0.2) 100%)',
        }}
      />

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center pb-2">
        <IconComponent
          className={cn(sizes.icon, 'drop-shadow-md')}
          style={{ color: config.iconColor }}
        />
      </div>

      {/* Label — engraved at bottom */}
      <div className="absolute bottom-[3px] inset-x-0 flex justify-center pointer-events-none">
        <span
          className={cn(
            sizes.label,
            'font-bold tracking-wider uppercase'
          )}
          style={{
            color: config.iconColor,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {config.labelShort}
        </span>
      </div>

      {/* Selection ring */}
      {selected && (
        <motion.div
          className="absolute -inset-[3px] rounded-full pointer-events-none"
          style={{
            border: '2px solid hsl(var(--gold))',
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
