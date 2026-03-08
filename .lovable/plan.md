

## Plan: Add Ledger Background to Market Prices & Center Items

### Changes

**1. `src/components/game/GameBoard.tsx` (lines 323-331)**
- Replace `bg-card border border-primary/20` with the same ledger background pattern used in `ScoreBoard.tsx`: `backgroundImage: url(/images/ledger-bg.png)`, `backgroundSize: 100% 100%`, plus the semi-transparent overlay div.
- Add `overflow-hidden relative` to the container.

**2. `src/components/game/TreasureStack.tsx`**
- Center the doubloon + icon layout better now that icons are offset. Add `justify-center` and `items-center` to the grid items. Potentially increase the container width or adjust the icon positioning to keep things visually centered within each grid cell.
- Wrap the doubloon area in a centered flex container to account for the right-offset cargo icon.

### Specific edits

**GameBoard.tsx line 323:**
```tsx
<div className={cn("p-4 rounded-xl border border-primary/20 relative overflow-hidden", compact && "p-3")} 
     style={{ backgroundImage: 'url(/images/ledger-bg.png)', backgroundSize: '100% 100%' }}>
  <div className="absolute inset-0 bg-background/40 pointer-events-none" />
  <div className="relative z-10">
    <h3 className="font-pirate text-lg text-primary mb-4 text-center">
      Market Prices
    </h3>
    <div className={cn("grid gap-4 place-items-center", compact ? "grid-cols-3" : "grid-cols-2")}>
      ...
    </div>
  </div>
</div>
```

**TreasureStack.tsx:** Add `items-center` alignment to the outer wrapper to ensure each stack is visually centered in its grid cell.

