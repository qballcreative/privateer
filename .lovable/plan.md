

# Landing Page Overhaul — Implementation Plan

## Overview

Complete redesign of `LandingPage.tsx`, splitting it into focused sub-components. The uploaded Privateer emblem logo (`Privateer.png`) becomes the primary brand anchor. The page flows: Hero → Set Sail panel (mode select + options + action buttons) → How to Plunder → Victory Conditions → Footer.

## Asset

Copy `user-uploads://Privateer.png` to `src/assets/Privateer.png` — used as the bronze medallion logo via ES6 import.

## File Structure

### 1. `src/components/game/HeroSection.tsx` — New

- Full-width hero with `hero-bg.jpg` background, dark gradient overlay
- Centered bronze medallion logo (`Privateer.png`), responsive sizing: `w-32 h-32` on mobile, `w-48 h-48` on `lg:`
- Below logo: "PLUNDER" in `font-pirate` gold text as the game mode title
- Subtle subtitle "A Trading Duel" beneath
- On mobile, hero collapses to shorter height; logo scales down
- Gentle float animation on logo via framer-motion

### 2. `src/components/game/SetSailPanel.tsx` — New

Central panel with bronze/wood styling (border with rope-like ring, dark card background, gold heading).

**Contains three sections stacked vertically:**

**A. Mode Select** — Two large pirate-themed buttons side by side (stack on mobile):
- "Battle the AAI" — Swords icon, gold gradient
- "Multiplayer" — Users icon, ocean gradient
- Selected mode gets highlighted border + subtle glow

**B. Options Row** — Compact config controls, evenly spaced, stack on narrow screens:
- **Best of**: Toggle group (1 | 3), styled as brass tabs
- **First Player**: Toggle group (Host | Random)
- **Pirate Level**: The existing 4-difficulty selector (Cabin Boy → Pirate Lord), shown only when AAI mode selected
- All controls use min 44px tap targets

**C. Action Buttons** — Large, clearly differentiated:
- When AAI mode: Single "Start vs AAI" button (gold variant, full width)
- When Multiplayer mode: Two buttons — "Create Room" (gold) and "Join Room" (ocean/outline)
- Rope/brass border styling via `ring-2 ring-[hsl(var(--rope))]` and shadow

### 3. `src/components/game/HowToPlunder.tsx` — New

Below-the-fold educational section replacing current "How to Play":
- Section title "How to Plunder" in `font-pirate`
- 3-column grid (stacks on mobile) with object-based icons:
  - **Claim Cargo**: Package/Anchor icon — take from Trading Post
  - **Trade Goods**: ArrowLeftRight icon — exchange between hold and post
  - **Unload Cargo**: Coins icon — sell matching cargo for doubloons
- Each card uses `bg-card/80` with rope-style border, bronze icon tint
- Simple diagrams using Lucide icons, no card art

### 4. `src/components/game/VictoryConditions.tsx` — New

Icon-heavy panel explaining win conditions:
- Centered panel with brass border styling
- Three icon rows:
  - Trophy + "Most doubloons wins the voyage"
  - Target + "Win 2 of 3 voyages to become Privateer Lord"  
  - AlertTriangle + "Voyage ends when supply ship empties or 3 cargo stacks depleted"
- Minimal text, maximum iconography

### 5. `src/components/game/LandingPage.tsx` — Rewritten

Composes the new components:
```
<InstallPrompt />
<AgeConsentModal /> (if !hasConsented)
<SettingsPanel /> (top-right)
<HeroSection />
<SetSailPanel 
  mode, setMode, difficulty, bestOf, firstPlayer,
  onStart, onCreateRoom, onJoinRoom, onShowMultiplayer
/>
{showMultiplayer ? <MultiplayerLobby /> : null}
<HowToPlunder />
<VictoryConditions />
<AdBanner />
<Footer />
```

State managed locally: `mode: 'aai' | 'multiplayer'`, `bestOf: 1 | 3`, `firstPlayer: 'host' | 'random'`, plus existing `difficulty`, `playerName`.

The `handleStart` function passes `bestOf` and `firstPlayer` config alongside existing params (these are stored but not yet used by game logic — future-proofing).

### 6. `src/index.css` — Minor additions

Add utility classes for rope borders and brass accents:
```css
.rope-border { 
  border: 2px solid hsl(var(--rope)); 
  box-shadow: inset 0 0 0 1px hsl(var(--rope)/0.3); 
}
.brass-glow { 
  box-shadow: 0 0 15px hsl(var(--brass)/0.3); 
}
```

## Responsive Behavior

- **Mobile (<768px)**: Hero short (40vh), logo `w-28`, mode buttons stack vertically, options stack vertically, action buttons full-width
- **Tablet (768-1024px)**: Hero medium (50vh), logo `w-40`, mode buttons side by side, options in a row
- **Desktop (>1024px)**: Hero full (60vh), logo `w-48`, all controls in a single comfortable row, max-width container

All interactive elements maintain 44px minimum touch targets.

## Design Language

- Bronze gradients using `--brass` / `--brass-light` CSS vars already defined
- Rope borders using `--rope` var
- Wood backgrounds using `--wood-plank` / `--wood-plank-light`
- Gold accent text and glows from existing `--gold` / `--gold-glow`
- Consistent with the embossed, historical medallion aesthetic

