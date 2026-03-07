import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';

export const InstallPrompt = () => {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-30 mx-auto max-w-md px-4 pt-4"
        >
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card/90 backdrop-blur-md px-4 py-3 shadow-lg">
            <Download className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground/80 flex-1">
              Install <span className="font-pirate text-primary">Privateer</span> for offline play
            </p>
            <Button size="sm" variant="gold" onClick={promptInstall} className="shrink-0 text-xs">
              Install
            </Button>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
