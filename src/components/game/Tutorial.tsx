import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastRectRef = useRef<string>('');
  const hasScrolledRef = useRef(false);

  const step = TUTORIAL_STEPS[currentStep];

  // Dispatch event to open drawers/sections on phone layout
  useEffect(() => {
    if (!isActive || !step?.highlightId) return;
    window.dispatchEvent(
      new CustomEvent('tutorial-step', { detail: { highlightId: step.highlightId } })
    );
  }, [isActive, step?.highlightId]);

  // RAF-based polling to track the target element position smoothly
  useEffect(() => {
    if (!isActive) {
      setHighlightRect(null);
      return;
    }

    hasScrolledRef.current = false;
    lastRectRef.current = '';

    const poll = () => {
      if (!step?.highlightId) {
        setHighlightRect(null);
        rafRef.current = requestAnimationFrame(poll);
        return;
      }

      const el = document.querySelector<HTMLElement>(
        `[data-tutorial-id="${step.highlightId}"]`
      );

      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        const rect = el.getBoundingClientRect();

        // Only scroll once per step, and only if element is not in viewport
        if (!hasScrolledRef.current) {
          hasScrolledRef.current = true;
          const inViewport =
            rect.top >= 0 &&
            rect.bottom <= window.innerHeight;
          if (!inViewport) {
            // Scroll the element's nearest scrollable parent, not the whole page
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }

        // Only update state when rect actually changes (avoids re-render churn)
        const key = `${rect.top.toFixed(1)},${rect.left.toFixed(1)},${rect.width.toFixed(1)},${rect.height.toFixed(1)}`;
        if (key !== lastRectRef.current) {
          lastRectRef.current = key;
          setHighlightRect(rect);
        }
      } else {
        if (lastRectRef.current !== 'null') {
          lastRectRef.current = 'null';
          setHighlightRect(null);
        }
      }

      rafRef.current = requestAnimationFrame(poll);
    };

    // Small delay to let drawers/sections open first
    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(poll);
    }, 350);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentStep, step?.highlightId]);

  if (!isActive) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  // Position tooltip relative to highlight, measuring actual tooltip height
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 12;
    const margin = 8;
    const tooltipW = Math.min(320, vw - margin * 2);
    const tooltipH = tooltipRef.current?.offsetHeight || 180;

    const clampLeft = (x: number) =>
      Math.max(margin, Math.min(x, vw - tooltipW - margin));
    const centerX = highlightRect.left + highlightRect.width / 2 - tooltipW / 2;

    const spaceBelow = vh - highlightRect.bottom - gap;
    const spaceAbove = highlightRect.top - gap;

    if (spaceBelow >= tooltipH) {
      return { top: `${highlightRect.bottom + gap}px`, left: `${clampLeft(centerX)}px` };
    }
    if (spaceAbove >= tooltipH) {
      return { top: `${highlightRect.top - gap - tooltipH}px`, left: `${clampLeft(centerX)}px` };
    }
    // Fallback: pin to bottom of viewport
    return { bottom: `${margin}px`, left: `${clampLeft(centerX)}px` };
  };

  // Clip-path cutout for the backdrop
  const getBackdropClip = (): string | undefined => {
    if (!highlightRect) return undefined;
    const p = 8;
    const x = highlightRect.left - p;
    const y = highlightRect.top - p;
    const w = highlightRect.width + p * 2;
    const h = highlightRect.height + p * 2;
    return `polygon(
      0% 0%, 0% 100%, ${x}px 100%, ${x}px ${y}px,
      ${x + w}px ${y}px, ${x + w}px ${y + h}px,
      ${x}px ${y + h}px, ${x}px 100%, 100% 100%, 100% 0%
    )`;
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75"
        style={{ clipPath: getBackdropClip() }}
        onClick={skip}
      />

      {/* Highlight ring */}
      {highlightRect && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none z-[101] transition-all duration-200"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.25), 0 0 20px hsl(var(--primary) / 0.3)',
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={tooltipRef}
          className="absolute z-[102] w-80 max-w-[calc(100vw-1rem)]"
          style={getTooltipStyle()}
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
