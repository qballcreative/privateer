

# Visual Redesign Plan: Privateer: Letters of Marque

## Vision Summary
Transform "Plunder" into "Privateer: Letters of Marque" - a premium tactile experience where players handle physical cargo objects on a weathered dock table, rather than abstract cards. Every interaction should feel like physically placing, swapping, or unloading cargo under a Letter of Marque.

---

## Design Philosophy

### Core Spatial Metaphors
| Current Term | New Metaphor | Visual Representation |
|--------------|--------------|----------------------|
| Market | **Trading Post** | Weathered dock table with cargo crates |
| Player Hand | **Ship's Hold** | Cargo bay with physical inventory slots |
| Cards | **Cargo Objects** | 3D-style physical goods (crates, barrels, chests) |
| Sell Action | **Unload Cargo** | Goods being offloaded → coins + commission medallions |
| Token Stacks | **Coin Purses** | Stacked doubloons with leather pouch aesthetic |
| Deck | **Supply Ship** | Silhouette of arriving cargo ship with count |

### Visual Tone
- Materials: Wood grain, brass fittings, rope texture, aged leather, parchment
- Lighting: Warm lantern glow, harbor at dusk ambiance
- Typography: Maintains `Pirata One` for headers, `Crimson Text` for body
- No cartoonish elements - grounded, premium tabletop aesthetic

---

## Phase 1: Foundation and Core Components

### 1.1 Rename and Rebrand
- Update title from "Plunder" to "Privateer: Letters of Marque"
- Update subtitle to "A Trading Duel"
- Update footer credits

**Files**: `LandingPage.tsx`, `GameBoard.tsx`, `index.html`

### 1.2 New Component: CargoObject (replaces GameCard)
Replace the card metaphor with physical cargo objects:

```text
+------------------+
|  ┌────────────┐  |  ← Wooden crate texture
|  │   [ICON]   │  |  ← Cargo icon (barrel, chest, etc.)
|  │    RUM     │  |  ← Brass label plate
|  └────────────┘  |
+------------------+
```

**Cargo visuals by type**:
- **Rum**: Wooden barrel + bottle combo (single unit)
- **Cannonballs**: Iron-bound crate with visible balls
- **Silks**: Wrapped bale with fabric texture
- **Silver**: Metal-banded strongbox
- **Gold**: Ornate chest with gold trim
- **Gemstones**: Velvet-lined jewelry case
- **Ships**: Miniature ship model on stand

**Files**: Create `src/components/game/CargoObject.tsx`

### 1.3 Update CSS Variables and Textures
Add new texture-based styling:
- Wood plank backgrounds for containers
- Rope border patterns
- Brass button/badge styling
- Parchment overlays for information panels

**Files**: `src/index.css`

---

## Phase 2: Trading Post (Market)

### 2.1 New Component: TradingPost (replaces Market)
Transform from card display to dock table surface:

```text
╔══════════════════════════════════════════════════╗
║              TRADING POST                        ║
║  ┌──────────────────────────────────────────┐   ║
║  │   [WOOD PLANKS TEXTURE BACKGROUND]       │   ║
║  │                                           │   ║
║  │   🪵  🛢️  📦  💎  ⛵                      │   ║
║  │  (cargo objects arranged on dock)        │   ║
║  │                                           │   ║
║  └──────────────────────────────────────────┘   ║
║                                                  ║
║  Supply Ship: ▓▓▓░░ 23 cargo remaining          ║
╚══════════════════════════════════════════════════╝
```

- Dock table surface with wood plank texture
- Cargo objects sit on the table (not floating cards)
- "Supply Ship" indicator replaces "Deck" count
- Rope border framing

**Files**: Create `src/components/game/TradingPost.tsx`, update `GameBoard.tsx`

### 2.2 Action Mode Toggles
Rename and restyle:
- "Take" → "Claim Cargo" (hand reaching icon)
- "Exchange" → "Trade Goods" (swap arrows over crates)
- "Take All Ships" → "Commandeer Fleet" (nautical wheel icon)

---

## Phase 3: Ship's Hold (Player Hand)

### 3.1 New Component: ShipsHold (replaces PlayerHand)
Transform player hand into cargo bay visualization:

```text
╔══════════════════════════════════════════════════╗
║  CAPTAIN'S HOLD                    ⚓ Fleet: 3   ║
╠══════════════════════════════════════════════════╣
║  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐   ║
║  │ 🛢️  │ 📦  │ 💎  │ 🥇  │     │     │     │   ║  ← 7 cargo slots
║  │ Rum │Silk │ Gem │Gold │     │     │     │   ║
║  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘   ║
║                                                  ║
║  [UNLOAD CARGO]        Doubloons: 45 | Bonus: 8 ║
╚══════════════════════════════════════════════════╝
```

- Visual slot system (7 slots for hand limit)
- Empty slots show as wooden compartments
- "Unload Cargo" replaces "Sell"
- Fleet count shows ship collection

**Files**: Create `src/components/game/ShipsHold.tsx`, update `GameBoard.tsx`

### 3.2 Opponent's Hold
Show opponent's cargo as obscured/covered crates:
- Tarp-covered cargo silhouettes
- Count indicator visible
- During Pirate Raid: tarps lift to reveal options

---

## Phase 4: Treasure Display

### 4.1 New Component: TreasureChest (replaces TokenStack)
Replace circular tokens with stacked doubloons:

```text
    ╭──────────╮
    │   RUM    │  ← Leather label
    ├──────────┤
    │ ⬤ ⬤ ⬤   │  ← Stacked coins
    │  ⬤ ⬤    │
    │   ⬤     │
    │   [4]   │  ← Top coin shows value
    ╰──────────╯
       5 left
```

**Files**: Create `src/components/game/TreasureStack.tsx`

### 4.2 Update BonusTokens Display
Transform to "Commission Medallions":
- Bronze/Silver/Gold medallions for 3/4/5 card bonuses
- Wax seal aesthetic

**Files**: Update `src/components/game/BonusTokens.tsx`

---

## Phase 5: Scoreboard and UI Chrome

### 5.1 Update ScoreBoard
Rename to "Captain's Ledger":
- Parchment texture background
- Quill/ink aesthetic for scores
- Round indicators become wax seals

### 5.2 Header Updates
- Game title: "Privateer: Letters of Marque"
- Optional rules icons get thematic frames (rope circles)
- Turn indicator: "Your Move, Captain" / "Opponent is trading..."

### 5.3 Action Notification Updates
Transform to "Harbor Master's Log":
- Parchment scroll appearance
- Handwritten-style descriptions
- Cargo icons instead of card previews

**Files**: Update `ScoreBoard.tsx`, `GameBoard.tsx`, `ActionNotification.tsx`

---

## Phase 6: Landing Page Redesign

### 6.1 Title and Branding
- Main title: "Privateer" (large, ornate)
- Subtitle: "Letters of Marque" (smaller, elegant)
- Tagline: "A Trading Duel" (replaces "A Pirate Trading Card Game")

### 6.2 Goods Showcase
Replace card icons with cargo object previews:
- Mini 3D-style cargo representations
- Tooltip: "Rum Barrels", "Silk Bales", etc.

### 6.3 How to Play Section
Update terminology:
- "Take" → "Claim cargo from the Trading Post"
- "Exchange" → "Trade goods with the harbor"
- "Sell" → "Unload cargo for doubloons and commission"

**Files**: Update `LandingPage.tsx`

---

## Phase 7: Victory/End Screens

### 7.1 Round End Modal
- "Voyage Complete" header
- Score shown as "Treasure Manifest"
- Ship comparison as fleet silhouettes

### 7.2 Game End Modal
- "Letters of Marque Awarded" for winner
- Treasure chest animation opening
- Final tally on aged parchment

**Files**: Update modals in `GameBoard.tsx`

---

## Asset Requirements

### New Images Needed
1. Wood plank texture (dock surface)
2. Cargo crate base texture
3. Leather/rope border elements
4. Parchment texture (for modals/scoreboard)
5. Brass plate texture (for labels)

### Cargo Object Icons (to replace card images)
- Rum: Barrel + bottle combo
- Cannonballs: Iron crate with visible balls
- Silks: Wrapped fabric bale
- Silver: Metal strongbox
- Gold: Ornate treasure chest
- Gemstones: Jewelry case
- Ships: Miniature model

---

## Implementation Order

1. **Foundation** (Phase 1): Rename, new CSS variables, CargoObject component
2. **Core Gameplay** (Phase 2-3): TradingPost + ShipsHold
3. **Scoring** (Phase 4-5): TreasureStack + Ledger updates
4. **Polish** (Phase 6-7): Landing page + Victory screens

---

## Technical Notes

### Component Mapping
| Old Component | New Component | Status |
|---------------|---------------|--------|
| `GameCard.tsx` | `CargoObject.tsx` | Create new |
| `Market.tsx` | `TradingPost.tsx` | Create new |
| `PlayerHand.tsx` | `ShipsHold.tsx` | Create new |
| `TokenStack.tsx` | `TreasureStack.tsx` | Create new |
| `BonusTokens.tsx` | Update in place | Modify |
| `ScoreBoard.tsx` | Update in place | Modify |

### Backward Compatibility
- Game logic in stores remains unchanged
- Types remain the same (Card, Token, etc.)
- Only visual/presentation layer changes

### Animation Updates
- Card flip → Crate lid opening
- Card selection → Cargo glow/lift effect
- Token collection → Coins dropping into purse

