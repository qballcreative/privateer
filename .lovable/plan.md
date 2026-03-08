

# Use Uploaded Image Assets for Cargo Tokens

## Overview

Replace the complex SVG-drawn cargo renderers in `CargoObject.tsx` with the provided high-quality illustrated PNG images. This massively simplifies the component while producing far better visuals.

## Assets to Copy

Copy all 8 uploaded images into `src/assets/tokens/`:
- `user-uploads://Rum.png` → `src/assets/tokens/rum.png`
- `user-uploads://Iron.png` → `src/assets/tokens/iron.png`
- `user-uploads://Silver.png` → `src/assets/tokens/silver.png`
- `user-uploads://Gold.png` → `src/assets/tokens/gold.png`
- `user-uploads://Gems.png` → `src/assets/tokens/gems.png`
- `user-uploads://Silk.png` → `src/assets/tokens/silk.png`
- `user-uploads://Ship.png` → `src/assets/tokens/ship.png`
- `user-uploads://Cargo.png` → `src/assets/tokens/cargo.png`

## File: `src/components/game/CargoObject.tsx` — Rewrite

- Remove all inline SVG renderer functions (RumBarrel, Cannonballs, SilverBars, GoldBars, GemStone, SilkRoll, ShipToken, CrateHidden)
- Import all 8 token images as ES6 modules
- Create a simple type-to-image map: `{ rum: rumImg, iron: ironImg, ... }`
- The hidden state uses the Cargo crate image
- Render: a `motion.div` container with an `<img>` tag showing the appropriate token image
- Keep existing interaction logic: selected ring, hover lift, disabled opacity, click handler, size scaling
- Size tiers control the container width (sm: ~48px, md: ~64px, lg: ~80px) — the images scale naturally via `object-contain`
- Drop shadow beneath the image for 3D grounding effect using `filter: drop-shadow()`

This turns ~350 lines of SVG code into ~60 lines of clean image rendering.

