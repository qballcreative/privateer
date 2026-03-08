import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore, TUTORIAL_STEPS } from '@/store/tutorialStore';
import { ChevronLeft, ChevronRight, X, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Tutorial = () => {
  const { isActive, currentStep, next, prev, skip } = useTutorialStore();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = TUTORIAL_STEPS[currentStep];

  const updateHighlight = useCallback(() => {
    if (!step?.highlightId) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-tutorial-id="${step.highlightId}"]`);
    if (el) {
      setHighlightRect(el.getBoundingClientRect());
    } else {
      setHighlightRect(null);
    }
  }, [step?.highlightId]);

  useEffect(() => {
    if (!isActive) return;
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [isActive, currentStep, updateHighlight]);

  if (!isActive) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const pos = step.position || 'bottom';
    const pad = 16;
    switch (pos) {
      case 'top':
        return {
          bottom: `${window.innerHeight - highlightRect.top + pad}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          right: `${window.innerWidth - highlightRect.left + pad}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.right + pad}px`,
          transform: 'translateY(-50%)',
        };
      case 'bottom':
      default:
        return {
          top: `${highlightRect.bottom + pad}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
    }
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
