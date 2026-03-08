

## Landing Page Redesign — "Board Game Box" Direction

The current landing page leans heavily into fantasy-pirate aesthetics (wood textures, rope borders, "Pirata One" font everywhere, cargo-slot insets). The redesign shifts to a **premium tabletop game box** feel — structured, colorful, product-like, and inviting.

### Design Concept

Think of the back of a high-quality board game box: a bold hero image with the logo, then structured panels showing "What's in the box" (gameplay mechanics), player count/difficulty info in clean badges, and a prominent "Play Now" call-to-action. The layout is informational, inviting, and polished.

### Changes

#### 1. HeroSection — Product showcase hero
- Keep the Privateer logo but remove the floating animation (too whimsical)
- Add a tagline beneath: "A Strategic Trading Card Game for 2 Players"
- Add player count / age / playtime badges (like game box info: "2 Players • Ages 10+ • 20-30 min")
- Reduce hero height slightly, stronger gradient fade to content below
- Replace `font-pirate` headings site-wide on the landing page with a cleaner serif (`Crimson Text` bold) — reserve `Pirata One` for the logo and in-game UI only

#### 2. SetSailPanel — Clean game setup card
- Replace `rope-border` and `cargo-slot` with a clean card: white/cream background with subtle border and soft shadow
- Replace `font-pirate` headings with bold serif
- Use colored pill badges for difficulty levels instead of inset wood tiles
- Mode buttons become clean outlined cards with icons
- Action button stays prominent but uses a solid color with rounded corners, no rope border

#### 3. HowToPlunder — "How to Play" product panel
- Restructure as a horizontal feature strip (3 numbered steps)
- Replace `cargo-slot` cards with clean white cards, subtle border, colored icon circles
- Use numbered step indicators (1, 2, 3) instead of just icons
- Replace `wood-separator` with clean thin dividers or spacing
- Section title: "How to Play" (less pirate-y)

#### 4. VictoryConditions — "Win Conditions" info box
- Clean bordered card with a subtle background tint
- Replace cargo-slot styling with simple list items and check/star icons
- Title: "How to Win"

#### 5. Footer — Minimal
- Clean dark footer, no wood/rope textures

#### 6. New CSS utility classes
- Add `.game-box-card` — clean card with cream bg, soft shadow, thin border
- Add `.step-badge` — numbered circle for how-to-play steps
- Landing page components stop using `cargo-slot`, `rope-border`, `wood-separator` (those stay for in-game UI)

### Files Changed
- `src/components/game/HeroSection.tsx` — tagline, badges, remove float animation, serif title
- `src/components/game/SetSailPanel.tsx` — clean card layout, pill badges, no rope/wood
- `src/components/game/HowToPlunder.tsx` — numbered steps, clean cards, rename to "How to Play"
- `src/components/game/VictoryConditions.tsx` — clean list card, rename heading
- `src/components/game/LandingPage.tsx` — minor footer cleanup
- `src/index.css` — add `.game-box-card`, `.step-badge` utility classes

