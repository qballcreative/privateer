import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore, TUTORIAL_STEPS } from '@/store/tutorialStore';
import { ChevronLeft, ChevronRight, X, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Steps that require drawers/sections to be open on phone
const TREASURE_DRAWER_STEPS = ['tutorial-market-prices', 'tutorial-bonus'];
const TRADING_POST_STEPS = ['tutorial-trading-post', 'tutorial-actions'];
const HOLD_STEPS = ['tutorial-ships-hold'];

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

export const Tutorial = () => {
  const { isActive, currentStep, next, prev, skip } = useTutorialStore();
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = TUTORIAL_STEPS[currentStep];

  // Dispatch event to open drawers/sections on phone layout
  useEffect(() => {
    if (!isActive || !step?.highlightId) return;
    window.dispatchEvent(
      new CustomEvent('tutorial-step', { detail: { highlightId: step.highlightId } })
    );
  }, [isActive, step?.highlightId]);

  // Find target element with retry
  const measureTarget = useCallback((): HighlightRect | null => {
    if (!step?.highlightId) return null;
    const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${step.highlightId}"]`);
    if (!el || el.offsetWidth === 0) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }, [step?.highlightId]);

  useEffect(() => {
    if (!isActive) {
      setRect(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 15; // 1500ms total
    let timer: ReturnType<typeof setTimeout>;

    const tryFind = () => {
      const measured = measureTarget();
      if (measured) {
        // Scroll into view if needed
        const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${step?.highlightId}"]`);
        if (el) {
          const inView = measured.top >= 0 && measured.top + measured.height <= window.innerHeight;
          if (!inView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Re-measure after scroll
            timer = setTimeout(() => {
              const remeasured = measureTarget();
              setRect(remeasured);
            }, 400);
            return;
          }
        }
        setRect(measured);
      } else if (attempts < maxAttempts) {
        attempts++;
        timer = setTimeout(tryFind, 100);
      } else {
        setRect(null);
      }
    };

    // Delay slightly for drawer animations
    timer = setTimeout(tryFind, 150);

    const handleResize = () => {
      const m = measureTarget();
      if (m) setRect(m);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, currentStep, measureTarget, step?.highlightId]);

  // Two-pass tooltip positioning
  useLayoutEffect(() => {
    if (!isActive) return;
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 12;
    const margin = 8;
    const tooltipW = Math.min(320, vw - margin * 2);
    const tooltipH = tooltip.offsetHeight || 180;

    if (!rect) {
      setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: `${tooltipW}px` });
      return;
    }

    const clampLeft = (x: number) => Math.max(margin, Math.min(x, vw - tooltipW - margin));
    const centerX = rect.left + rect.width / 2 - tooltipW / 2;

    const spaceBelow = vh - (rect.top + rect.height + PADDING) - gap;
    const spaceAbove = (rect.top - PADDING) - gap;

    let style: React.CSSProperties;
    if (spaceBelow >= tooltipH) {
      style = { top: `${rect.top + rect.height + PADDING + gap}px`, left: `${clampLeft(centerX)}px`, width: `${tooltipW}px` };
    } else if (spaceAbove >= tooltipH) {
      style = { top: `${rect.top - PADDING - gap - tooltipH}px`, left: `${clampLeft(centerX)}px`, width: `${tooltipW}px` };
    } else {
      style = { bottom: `${margin}px`, left: `${clampLeft(centerX)}px`, width: `${tooltipW}px` };
    }
    setTooltipPos(style);
  }, [isActive, rect, currentStep]);

  if (!isActive) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  // Four-rectangle backdrop
  const renderBackdrop = () => {
    if (!rect) {
      return <div className="absolute inset-0 bg-black/75" onClick={skip} />;
    }

    const t = rect.top - PADDING;
    const l = rect.left - PADDING;
    const w = rect.width + PADDING * 2;
    const h = rect.height + PADDING * 2;

    return (
      <>
        {/* Top */}
        <div className="absolute bg-black/75" style={{ top: 0, left: 0, right: 0, height: `${Math.max(0, t)}px` }} onClick={skip} />
        {/* Bottom */}
        <div className="absolute bg-black/75" style={{ top: `${t + h}px`, left: 0, right: 0, bottom: 0 }} onClick={skip} />
        {/* Left */}
        <div className="absolute bg-black/75" style={{ top: `${t}px`, left: 0, width: `${Math.max(0, l)}px`, height: `${h}px` }} onClick={skip} />
        {/* Right */}
        <div className="absolute bg-black/75" style={{ top: `${t}px`, left: `${l + w}px`, right: 0, height: `${h}px` }} onClick={skip} />
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {renderBackdrop()}

      {/* Highlight ring */}
      {rect && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none z-[101] transition-all duration-200"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.25), 0 0 20px hsl(var(--primary) / 0.3)',
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={tooltipRef}
          className="absolute z-[102] max-w-[calc(100vw-1rem)]"
          style={tooltipPos}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xl">
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
