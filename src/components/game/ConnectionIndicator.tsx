/** ConnectionIndicator — Multiplayer connection status badge with latency display. */
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMultiplayerStore } from '@/store/multiplayerStore';

interface ConnectionIndicatorProps {
  className?: string;
}

export const ConnectionIndicator = ({ className }: ConnectionIndicatorProps) => {
  const { state, latency, opponentName } = useMultiplayerStore();

  const getConnectionQuality = () => {
    if (state === 'disconnected' || latency === null) {
      return { label: 'Disconnected', color: 'text-destructive', bgColor: 'bg-destructive/20', borderColor: 'border-destructive/30', Icon: WifiOff };
    }
    if (latency < 100) {
      return { label: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', Icon: SignalHigh };
    }
    if (latency < 200) {
      return { label: 'Good', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30', Icon: SignalMedium };
    }
    if (latency < 400) {
      return { label: 'Fair', color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/30', Icon: SignalLow };
    }
    return { label: 'Poor', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', Icon: Signal };
  };

  const quality = getConnectionQuality();
  const { Icon } = quality;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        quality.bgColor,
        quality.borderColor,
        className
      )}
    >
      <motion.div
        animate={state === 'disconnected' ? {} : { opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Icon className={cn('w-4 h-4', quality.color)} />
      </motion.div>
      <div className="flex flex-col">
        <span className={cn('text-xs font-medium', quality.color)}>
          {opponentName || 'Opponent'}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {state === 'disconnected' ? (
            'Disconnected'
          ) : latency !== null ? (
            `${latency}ms • ${quality.label}`
          ) : (
            'Connecting...'
          )}
        </span>
      </div>
    </motion.div>
  );
};
