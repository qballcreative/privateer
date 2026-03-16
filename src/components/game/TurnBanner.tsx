/** TurnBanner — Brief "Your Turn" overlay that flashes when control passes to the local player. */
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor } from 'lucide-react';

interface TurnBannerProps {
  show: boolean;
}

export const TurnBanner = ({ show }: TurnBannerProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className="fixed top-4 inset-x-0 z-[60] pointer-events-none flex justify-center"
        >
          <div className="relative px-8 py-3 rounded-xl bg-card/95 border-2 border-primary/50 shadow-[0_0_30px_hsl(var(--gold)/0.4)] backdrop-blur-sm">
            {/* Gold shimmer line */}
            <motion.div
              className="absolute inset-0 rounded-xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            </motion.div>

            <div className="relative flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <Anchor className="w-6 h-6 text-primary" />
              </motion.div>
              <span className="font-pirate text-2xl text-primary tracking-wide">
                Your Turn, Captain!
              </span>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <Anchor className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
