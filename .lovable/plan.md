

# Logo & Treasure Supply Redesign

## Overview
Move the Privateer logo out of the header bar, make it larger and prominent above the game area. Place the Treasure Supply (Doubloons + Commissions) below the logo in a styled frame. This affects the desktop and tablet layouts; mobile keeps the drawer approach.

## Changes to `src/components/game/GameBoard.tsx`

### 1. Logo — remove from header, add as centered hero element
- Remove the `<img src={privateerLogo}>` from the header bar (line 440)
- Add a centered logo block above the main game grid (after header, before layout sections)
- Size: `h-16 sm:h-20 lg:h-24` with the brass glow drop-shadow
- Keep active rules badges in the header

### 2. Treasure Supply Panel — add a styled frame
- Wrap the `TreasureSupplyPanel` content in a themed frame: wood/brass border aesthetic using `cargo-slot` styling with an ornate border (`border-2 border-[hsl(var(--brass-light)/0.4)]`), inner shadow, and a header plaque
- Add a "Treasure Supply" title plaque at the top of the frame using `leather-texture` styling

### 3. Layout adjustments
- **Desktop**: Remove the left sidebar `TreasureSupplyPanel`. Instead, place the framed Treasure Supply horizontally below the centered logo, above the main 2-column game area (Trading Post + Hold)
- **Tablet**: Same — move treasure supply from right column to below logo
- **Mobile**: Keep as-is (drawer), but apply the frame styling inside the drawer too

### Files
- `src/components/game/GameBoard.tsx` — all changes in this single file

