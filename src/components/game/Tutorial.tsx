import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore, TUTORIAL_STEPS } from '@/store/tutorialStore';
import { ChevronLeft, ChevronRight, X, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Steps that require drawers/sections to be open on phone
const TREASURE_DRAWER_STEPS = ['tutorial-market-prices', 'tutorial-bonus'];
const TRADING_POST_STEPS = ['tutorial-trading-post', 'tutorial-actions'];
const HOLD_STEPS = ['tutorial-ships-hold'];

export const Tutorial = () => {
  const { isActive, currentStep, next, prev, skip } = useTutorialStore();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const retryRef = useRef<number>(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = TUTORIAL_STEPS[currentStep];

  const updateHighlight = useCallback(() => {
    if (!step?.highlightId) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-tutorial-id="${step.highlightId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only set if element is actually visible (has dimensions)
      if (rect.width > 0 && rect.height > 0) {
        setHighlightRect(rect);
        retryRef.current = 0;
        return;
      }
    }
    setHighlightRect(null);

    // Retry mechanism: if element not found, retry up to 5 times with increasing delays
    if (retryRef.current < 5) {
      retryRef.current++;
      retryTimerRef.current = setTimeout(updateHighlight, 300);
    }
  }, [step?.highlightId]);

  // Dispatch custom event to tell PhoneLayout which tutorial element we need visible
  useEffect(() => {
    if (!isActive || !step?.highlightId) return;
    window.dispatchEvent(new CustomEvent('tutorial-step', { detail: { highlightId: step.highlightId } }));
  }, [isActive, step?.highlightId]);

  useEffect(() => {
    if (!isActive) return;
    retryRef.current = 0;

    // Small delay to allow drawers/sections to open first
    const initTimer = setTimeout(() => {
      if (step?.highlightId) {
        const el = document.querySelector(`[data-tutorial-id="${step.highlightId}"]`);
        if (el) {
          // Determine if element is near top or bottom of viewport
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const scrollBlock = rect.top > vh * 0.6 ? 'start' : 'center';
          el.scrollIntoView({ behavior: 'smooth', block: scrollBlock as ScrollLogicalPosition });
          setTimeout(updateHighlight, 400);
        }
      }
      updateHighlight();
    }, 200);

    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);
    return () => {
      clearTimeout(initTimer);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [isActive, currentStep, updateHighlight]);

  if (!isActive) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  // Auto-positioning: below if fits, above otherwise — always horizontally centered
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 16;
    const margin = 8;
    const tooltipW = Math.min(320, vw - margin * 2);
    const tooltipH = 200;

    const clampLeft = (idealLeft: number) =>
      Math.max(margin, Math.min(idealLeft, vw - tooltipW - margin));

    const centerX = highlightRect.left + highlightRect.width / 2 - tooltipW / 2;

    // Try below first
    const belowTop = highlightRect.bottom + pad;
    if (belowTop + tooltipH < vh - margin) {
      return {
        top: `${belowTop}px`,
        left: `${clampLeft(centerX)}px`,
      };
    }

    // Fall back to above
    const aboveTop = highlightRect.top - pad - tooltipH;
    return {
      top: `${Math.max(margin, aboveTop)}px`,
      left: `${clampLeft(centerX)}px`,
    };
  };

  // Build clip-path to cut out the highlighted region
  const getBackdropStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      return { background: 'rgba(0,0,0,0.75)' };
    }
    const p = 8;
    const x = highlightRect.left - p;
    const y = highlightRect.top - p;
    const w = highlightRect.width + p * 2;
    const h = highlightRect.height + p * 2;
    return {
      clipPath: `polygon(
        0% 0%, 0% 100%, ${x}px 100%, ${x}px ${y}px,
        ${x + w}px ${y}px, ${x + w}px ${y + h}px,
        ${x}px ${y + h}px, ${x}px 100%, 100% 100%, 100% 0%
      )`,
      background: 'rgba(0,0,0,0.75)',
    } as React.CSSProperties;
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop with cutout */}
      <div className="absolute inset-0" style={getBackdropStyle()} onClick={skip} />

      {/* Highlight border */}
      {highlightRect && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none z-[101]"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: 'var(--shadow-gold)',
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="absolute z-[102] w-80 max-w-[calc(100vw-2rem)]"
          style={getTooltipStyle()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {step.optional && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">
                    Optional
                  </span>
                )}
                <h3 className="font-serif text-lg font-bold text-primary">{step.title}</h3>
              </div>
              <button onClick={skip} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{step.description}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {TUTORIAL_STEPS.length}
              </span>
              <div className="flex gap-2">
                {!isFirst && (
                  <Button variant="ghost" size="sm" onClick={prev} className="h-8 px-3">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                )}
                <Button size="sm" onClick={next} className="h-8 px-3">
                  {isLast ? (
                    <>
                      <Anchor className="w-4 h-4 mr-1" /> Set Sail!
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export { TREASURE_DRAWER_STEPS, TRADING_POST_STEPS, HOLD_STEPS };
