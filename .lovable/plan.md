

# Commandeer Fleet Button Redesign

## Changes to `src/components/game/TradingPost.tsx`

1. **Move the Commandeer Fleet button above the overlay** — move it outside the trading post container (or give it `z-20+`) so it renders on top of the `bg-card/80` overlay
2. **Replace the Anchor icon** with the uploaded Fleet image (`public/images/fleet.png`)
3. **Make it visually striking** — larger image that overflows the button, with a glowing/shadow effect. The ship image will sit above or beside the button text, larger than the button rectangle itself, creating a dynamic "breaking out of the box" look.

## Asset
- Copy `user-uploads://Fleet.png` → `public/images/fleet.png`

## Implementation
- Replace the `<Button>` with a custom styled clickable element: a container with the fleet image protruding above (~60-80px tall) and the text label below in a styled pill/banner
- Add `relative z-20` so it sits above the overlay
- Add a subtle hover animation (scale + glow)

