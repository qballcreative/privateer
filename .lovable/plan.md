

## Parchment Theme Readability Fix

### Root Cause

The game board uses semi-transparent overlays (`bg-card/80`, `bg-background/40`) on top of background images (cargo hold, trading post, ledger). In **dark mode**, `--card` is a dark brown (`20 35% 12%`) so the overlay creates a dark tinted surface where light text and token images pop. In **parchment mode**, `--card` is a light cream (`35 35% 88%`), so the overlay becomes a near-opaque white wash — tokens vanish into it and text loses contrast.

### Affected Spots

| Component | Overlay | Line |
|---|---|---|
| `ShipsHold.tsx` | `bg-card/80` on cargo hold | 135 |
| `TradingPost.tsx` | `bg-card/80` on trading post | 165 |
| `GameBoard.tsx` (TreasureSupplyPanel) | `bg-background/40` on ledger/market prices | 68 |
| `ScoreBoard.tsx` | `bg-background/40` on ledger | 12 |
| `ShipsHold.tsx` | `bg-card/70` on pondering overlay | 208 |

### Fix Approach

Add parchment-specific override CSS variables and adjust the overlays:

1. **`src/index.css`** — In the `[data-theme="parchment"]` block, add darker custom overlay colors:
   - `--overlay-surface: 25 30% 30%` (dark brown, used at low opacity for image overlays)
   - Also darken `--wood-plank`, `--mahogany`, `--leather` variables so wood textures remain visible

2. **`ShipsHold.tsx`** (line 135) — Change `bg-card/80` to a theme-aware class. Use a new utility class `.surface-overlay` that resolves to `bg-card/80` in dark and `bg-[hsl(25,30%,30%)]/60` in parchment, or simpler: use `bg-black/50` which works in both themes as a universal darkening overlay on background images.

3. **`TradingPost.tsx`** (line 165) — Same fix: replace `bg-card/80` with `bg-black/50`.

4. **`GameBoard.tsx`** (line 68) and **`ScoreBoard.tsx`** (line 12) — Replace `bg-background/40` with `bg-black/40` so the ledger image shows through with a universal dark tint.

5. **`ShipsHold.tsx`** pondering overlay (line 208) — Replace `bg-card/70` with `bg-black/50 dark:bg-card/70` or just `bg-black/50`.

### Why `bg-black/50` instead of theme variables

Using `bg-black/50` as the image overlay tint is the simplest universal fix. These overlays sit on top of photographic/illustrated backgrounds (wood, parchment, leather textures). A dark semi-transparent overlay works in both themes — it subdues the background while keeping token images and text readable. The card/background CSS variables are designed for solid surfaces, not image overlays.

### Additional CSS tweak

In `[data-theme="parchment"]`, add:
- `--shadow-card: 0 4px 16px hsl(25, 20%, 60%, 0.3)` — lighter shadow so cards don't look odd
- Ensure `--foreground` stays dark enough (`25 40% 15%` is fine — already a dark brown)

### Files changed

| File | Change |
|---|---|
| `src/components/game/ShipsHold.tsx` | Line 135: `bg-card/80` → `bg-black/50`; Line 208: `bg-card/70` → `bg-black/50` |
| `src/components/game/TradingPost.tsx` | Line 165: `bg-card/80` → `bg-black/50` |
| `src/components/game/GameBoard.tsx` | Line 68: `bg-background/40` → `bg-black/40` |
| `src/components/game/ScoreBoard.tsx` | Line 12: `bg-background/40` → `bg-black/40` |
| `src/index.css` | Lighten `--shadow-card` and `--shadow-elevated` in parchment block |

