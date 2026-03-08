

# Trading Post Background Redesign

## Current State
The Trading Post uses `wood-plank-texture` — a simple repeating linear gradient simulating wooden planks with a rope border. It's generic and doesn't evoke a trading post.

## Proposed Design
Create a richer trading post atmosphere with layered visual elements:

1. **Background**: Replace flat wood planks with a weathered market stall look — a darker, aged wood base with a subtle canvas/cloth awning gradient at the top edge
2. **Surface details**: Add a faint grid pattern suggesting a woven mat or counter surface where goods are displayed
3. **Corner accents**: CSS pseudo-elements adding rope coil or nail details at corners
4. **Warm lighting**: Subtle radial gradient from center suggesting lantern light illuminating the goods
5. **Edge treatment**: Replace the flat rope border with a thicker, more textured border using layered box-shadows simulating worn timber framing

## Technical Changes

### `src/index.css`
- Create new `.trading-post-surface` class replacing `wood-plank-texture` usage in TradingPost:
  - Dark aged wood base gradient
  - Overlaid subtle burlap/canvas weave pattern (repeating-linear-gradient crosshatch at low opacity)
  - Warm radial glow from center (amber/lantern light at ~5% opacity)
  - Heavier inset shadows for depth (recessed counter feel)
  - Top edge gradient suggesting a canvas awning overhang

### `src/components/game/TradingPost.tsx`
- Replace `wood-plank-texture` with `trading-post-surface` on the main container
- Add a subtle top bar div styled as an awning/shelf edge above the goods area
- Keep `rope-border` and `overflow-visible mt-4`

