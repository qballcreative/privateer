

## How to Play Page with Interactive Tutorial Overlay

### Overview
Create a dedicated `/how-to-play` page with detailed game instructions and an interactive step-by-step tutorial overlay that walks new players through a mock game setup and each available move, including optional rules.

### Architecture

**New files:**
- `src/pages/HowToPlay.tsx` — Main instructions page with sections for each game concept
- `src/components/game/Tutorial.tsx` — Interactive overlay tutorial component using a step-based state machine
- `src/store/tutorialStore.ts` — Zustand store to track tutorial step, active highlight, and completion

**Modified files:**
- `src/App.tsx` — Add `/how-to-play` route
- `src/components/game/LandingPage.tsx` — Add a "How to Play" button/link in the hero or nav area
- `src/components/game/HowToPlunder.tsx` — Link its "How to Play" heading to the new page

### Page Structure (`HowToPlay.tsx`)

Scrollable page with the game's visual theme (pirate styling, game-box-card panels):

1. **Overview** — Brief game summary (Jaipur-style trading duel on the high seas)
2. **Game Setup** — Trading Post (market), Ship's Hold (hand), Supply Ship (deck), Market Prices (token stacks), Commission Medallions (bonus tokens)
3. **Your Turn — Actions Available:**
   - **Claim Cargo** — Take 1 good from the Trading Post (with icon)
   - **Commandeer Fleet** — Take all ships at once (with icon)
   - **Trade Goods** — Exchange 2+ cards between Hold and Trading Post (with icon)
   - **Sell Cargo** — Sell 2+ matching goods for doubloons; bonus medallions for 3/4/5+ (with icon)
4. **Hand Limit** — 7-card limit in Ship's Hold (ships don't count)
5. **Scoring** — Token values decrease as goods are sold; most doubloons wins
6. **End Conditions** — Deck empty or 3 token stacks depleted
7. **Optional Rules Section:**
   - **Storm Rule** — Every 3rd turn, 2 random market goods swept away and replaced
   - **Pirate Raid** — Once per game, steal 1 random cargo from opponent's hold
   - **Treasure Chest** — Hidden bonus token revealed at round end
8. **"Start Tutorial" button** — Launches the overlay

### Tutorial Overlay (`Tutorial.tsx`)

A fixed full-screen overlay with a semi-transparent backdrop. Uses a spotlight/highlight approach to draw attention to specific UI areas on a mock game board rendered underneath.

**Steps (approximately 12-15):**
1. Welcome — "Let's learn to play!" with game logo
2. **The Trading Post** — Highlight the market area, explain the 5-card market
3. **Your Ship's Hold** — Highlight hand area, explain card storage
4. **Market Prices** — Highlight token stacks, explain decreasing values
5. **Claim Cargo** — Animate taking a card from market to hand
6. **Commandeer Fleet** — Explain taking all ships
7. **Trade Goods** — Show selecting cards from both sides to exchange
8. **Sell Cargo** — Show selling matching goods, earning tokens
9. **Bonus Medallions** — Explain 3/4/5-card bonuses
10. **Hand Limit** — Show the 7-card limit warning
11. **Storm Rule** (optional) — Show storm event clearing market cards
12. **Pirate Raid** (optional) — Show stealing a card from opponent
13. **Treasure Chest** (optional) — Show hidden bonus reveal
14. **Winning** — Explain scoring and victory conditions
15. **Ready to Sail!** — CTA to start a game

Each step has: title, description, a highlight region (CSS clip-path or z-index spotlight), next/previous/skip buttons, and a step counter (e.g., "Step 3 of 15").

**Implementation approach:**
- Render a simplified static mock game board (reuse `TradingPost`, `ShipsHold` visuals but with static dummy data, no interactivity)
- Overlay a dark backdrop with a "cutout" around the highlighted area using `box-shadow: 0 0 0 9999px rgba(0,0,0,0.7)`
- Position a tooltip card near the highlighted element with the step's explanation
- Animate transitions between steps with framer-motion

### Tutorial Store (`tutorialStore.ts`)

```typescript
interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}
```

### Route & Navigation

- Add route `/how-to-play` in `App.tsx`
- Add a styled link/button on the landing page (near the HowToPlunder section or in the hero)
- Back button on the How to Play page returns to landing

### Styling
- Matches existing pirate theme: `font-pirate`, `font-serif`, `game-box-card`, `text-primary`, gold accents
- Uses existing icons from `/Icons/` folder
- Responsive: stacks vertically on mobile, side-by-side on desktop

