

## Plan: Replace all action icons with custom images

### Assets to save
- `user-uploads://Claim.png` → `public/Icons/Claim.png`
- `user-uploads://Trade.png` → `public/Icons/Trade.png`
- `user-uploads://Sell.png` → `public/Icons/Sell.png`
- `user-uploads://Raid.png` → `public/Icons/Raid.png`
- `user-uploads://Storm.png` → `public/Icons/Storm.png`

### ActionNotification.tsx
Replace all Lucide icons with custom images:
- `take` → `/Icons/Claim.png`
- `take-ships` → `/images/fleet.png` (existing asset)
- `exchange` → `/Icons/Trade.png`
- `sell` → `/Icons/Sell.png`
- `raid` → `/Icons/Raid.png`
- `storm` → `/Icons/Storm.png`

Convert the `actionIcons` map from Lucide components to image path strings. Update the render to use `<img>` tags instead of `<Icon>` components. Remove unused Lucide imports (Package, Ship, Crosshair, CloudLightning).

### TradingPost.tsx
- "Claim Cargo" button: replace `<Hand>` with `<img src="/Icons/Claim.png">`
- "Trade Goods" button: replace `<ArrowLeftRight>` with `<img src="/Icons/Trade.png">`

### Files to modify
- `src/components/game/ActionNotification.tsx`
- `src/components/game/TradingPost.tsx`

