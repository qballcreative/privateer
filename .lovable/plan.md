

# Redesign Cargo Tokens as 3D Illustrated Objects

## Overview

Replace the current flat circular tokens with visually distinct, illustrated 3D objects that represent their cargo type. Each token becomes a recognizable physical object rather than a generic coin with an icon. The hidden opponent cargo becomes a wooden crate.

## Token Designs (CSS/SVG-drawn with layered divs)

Each token changes from `rounded-full` (circle) to a shaped object:

| Type | Shape | Visual |
|------|-------|--------|
| **Rum** | Rounded rectangle (barrel) | Brown wooden barrel with dark bands, "XXX" text, warm amber glow |
| **Iron** | Rounded square | Pyramid stack of 3 dark iron cannonballs on a wooden base |
| **Silver** | Rounded rectangle (landscape) | Stack of 2-3 silver metallic bars with specular highlights |
| **Gold** | Rounded rectangle (landscape) | Stack of 2-3 gold metallic bars, rich yellow gradient |
| **Gems** | Hexagonal/diamond shape | Faceted gemstone with prismatic emerald gradient and sparkle |
| **Silks** | Rounded rectangle | Draped fabric roll in rich purple with fold lines |
| **Ships** | Custom ship silhouette container | Galleon silhouette with mast, sails, hull shape |
| **Hidden (Crate)** | Square with wood grain | Wooden shipping crate with plank lines, rope cross, nails |

## Technical Approach — `CargoObject.tsx` rewrite

### Shape System
- Replace uniform `rounded-full` with per-type shape classes
- Each cargo type gets its own inline SVG illustration drawn with simple shapes (rects, circles, paths) styled with gradients
- Maintain size variants (sm/md/lg) by scaling the container

### Per-type Renderer
Instead of a single layout with swappable icon, each type gets a dedicated render function returning layered `div` + inline SVG elements:

- **Rum Barrel**: Rounded-rect container, horizontal plank lines (thin divs), two dark band stripes, "XXX" centered text, wood gradient
- **Cannonballs**: Square container, 3 circles arranged in pyramid (2 bottom, 1 top), iron-grey radial gradients with specular dots
- **Silver Bars**: Landscape rect, 2-3 parallelogram shapes stacked, cool silver gradient with white edge highlights
- **Gold Bars**: Same as silver but warm gold gradient
- **Gems**: Diamond/hexagon container, faceted interior lines radiating from center, emerald green gradient with sparkle dot
- **Silks**: Rect container, wavy fold lines, purple satin gradient
- **Ships**: Wider container, hull curve (CSS clip-path or border-radius trick), mast line, triangular sail shapes
- **Crate (hidden)**: Square, horizontal plank lines, vertical plank lines forming grid, corner nail dots, rope cross

### 3D Depth (consistent across all)
- Top specular highlight gradient
- Bottom shadow gradient  
- `inset` box-shadow for depth
- Drop shadow beneath object
- Hover: lift + intensified shadow + subtle glow

### Size Config Update
Shapes are no longer uniform squares — each type defines its own aspect ratio within the size tier:
- sm: ~48px tall, width varies by type
- md: ~64px tall
- lg: ~80px tall

### Selection & Interaction
- Selection ring adapts to shape (rounded-rect border instead of circle)
- Hover lift animation unchanged
- Layout animation IDs preserved

## Files to Modify

1. **`src/components/game/CargoObject.tsx`** — Full rewrite with per-type SVG renderers, new shape system, crate hidden state
2. **`src/components/game/ShipsHold.tsx`** — Update empty slot shape from `rounded-full` to `rounded-lg` to match new token shapes

