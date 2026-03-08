

## Fix Commissions Icon Clipping in Captain's Ledger

The commissions icon is being clipped because the grid row doesn't have enough height to show the full icon, and `overflow-visible` on just the icon container isn't enough — the parent containers also clip.

### Changes to `src/components/game/ScoreBoard.tsx`

1. Add `overflow-visible` to the score breakdown grid (line 85) so the enlarged icons aren't clipped by the grid container
2. Add `overflow-visible` to the player manifest card (line 46-51) so nothing clips at that level either
3. Apply `overflow-visible` consistently to all three icon containers (Doubloons and Fleet too, not just Commissions)

This ensures the full icon artwork is visible without needing to resize the actual layout containers.

