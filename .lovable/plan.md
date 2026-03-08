

## Problem

The `UnloadChest` component tracks `lastAction` from the game store to trigger the "+value" token animation after a sell. When you switch from "Trade Goods" back to "Claim Cargo", the Captain's Hold (which contains `UnloadChest`) re-mounts due to AnimatePresence. On remount, the `useEffect` on line 125 re-fires with the same stale `lastAction` (still type `'sell'`), replaying the earned-token animation.

## Fix

**`src/components/game/UnloadChest.tsx`** — Track the `lastAction` identity so the animation only fires once per unique sell action, not on every mount.

- Add a `useRef` to store the last-processed action reference.
- In the `useEffect`, compare `lastAction` against the ref. If it's the same object, skip the animation.
- Update the ref after processing.

```tsx
const processedAction = useRef<typeof lastAction>(null);

useEffect(() => {
  if (lastAction?.type === 'sell' && lastAction.cardsInvolved && lastAction !== processedAction.current) {
    processedAction.current = lastAction;
    // ... existing animation logic
  }
}, [lastAction]);
```

This is a single-line guard addition — no other files need changes.

