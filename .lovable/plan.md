

## Arced exit animation on Take/Exchange + dust-puff entrance for new market items

### What changes

**Market.tsx** — two animation updates:

1. **Exit animation (Take / Exchange):** Replace the current `exit: { opacity: 0, scale: 0.8 }` with a custom arc path using Framer Motion keyframes. The card will move downward and to the right along a parabolic curve (`y` goes negative then positive, `x` shifts right) while fading out, using the custom cubic-bezier `[0.2, 0.8, 0.2, 1]` easing.

   ```
   exit: {
     opacity: [1, 0.8, 0],
     y: [0, -40, 60],
     x: [0, 30, 80],
     scale: [1, 1.05, 0.7],
   }
   transition (exit): {
     duration: 0.5,
     ease: [0.2, 0.8, 0.2, 1],
   }
   ```

2. **Enter animation (new cards rising from dock):** Replace the current `initial: { opacity: 0, y: -20, rotateY: 180 }` with a "rise from below" entrance with a dust-puff effect. The card starts below (`y: 40`), transparent, slightly scaled down, then settles into place. A separate dust-puff element (a small radial blur div) fades in and out behind each entering card.

   ```
   initial: { opacity: 0, y: 40, scale: 0.85 }
   animate: { opacity: 1, y: 0, scale: 1 }
   transition (enter): {
     duration: 0.45,
     ease: [0.2, 0.8, 0.2, 1],
   }
   ```

   The dust puff is a sibling `motion.div` with absolute positioning, a radial gradient (tan/transparent), that animates: `opacity: [0, 0.6, 0]` and `scale: [0.5, 1.5, 2]` over ~0.5s, then auto-removes via `onAnimationComplete`.

### Files modified

- `src/components/game/Market.tsx` — update the `motion.div` wrapping each market card's `initial`, `animate`, `exit`, and `transition` props; add a dust-puff child element that triggers on mount.

### No functional or UX changes

All game logic, store interactions, and layout remain identical. Only the motion variants on market card enter/exit are updated.

