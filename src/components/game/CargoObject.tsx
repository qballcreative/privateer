import { motion } from 'framer-motion';
import { Card, CardType } from '@/types/game';
import { cn } from '@/lib/utils';

import rumImg from '@/assets/tokens/rum.png';
import ironImg from '@/assets/tokens/iron.png';
import silverImg from '@/assets/tokens/silver.png';
import goldImg from '@/assets/tokens/gold.png';
import gemsImg from '@/assets/tokens/gems.png';
import silkImg from '@/assets/tokens/silk.png';
import shipImg from '@/assets/tokens/ship.png';
import cargoImg from '@/assets/tokens/cargo.png';

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

const tokenImages: Record<CardType, string> = {
  rum: rumImg,
  cannonballs: ironImg,
  silver: silverImg,
  gold: goldImg,
  gemstones: gemsImg,
  silks: silkImg,
  ships: shipImg,
};

const sizeClasses = {
  sm: 'w-14',
  md: 'w-20',
  lg: 'w-24',
};

const CargoObject = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  hidden = false,
  size = 'md',
  className,
  enableLayoutId = false,
}: CargoObjectProps) => {
  const imgSrc = hidden ? cargoImg : tokenImages[card.type];

  const isInteractive = onClick && !disabled;

  return (
    <motion.div
      {...(enableLayoutId ? { layoutId: `cargo-${card.id}` } : {})}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={hidden ? 'Hidden cargo' : card.type}
      onKeyDown={isInteractive ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      className={cn(
        'relative flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        sizeClasses[size],
        selected && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent rounded-lg',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : { scale: 1.12, y: -4 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <img
        src={imgSrc}
        alt={hidden ? 'Hidden cargo' : card.type}
        className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
        draggable={false}
      />
    </motion.div>
  );
};

export default CargoObject;
