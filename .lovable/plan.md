

## Swap PNG/JPG to WebP Across Codebase

Swap all image references from `.png` to `.webp` where a `.webp` file exists. Note: the `public/Icons/` webp files are **lowercase** (e.g., `claim.webp` not `Claim.webp`), so paths change case too.

### Files with no webp available (will NOT be changed)
- `src/assets/cards/` — no webp versions
- `src/assets/Logo.png`, `src/assets/card-back.png` — no webp
- `public/images/hero-bg.jpg` — no webp
- `public/Icons/` pngs: bonus, bonus3, bonus4, bonus5, cannonballs, exchange, gemstones, gold, round_win, rum, silks, silver, take — no webp

### Changes by file

| # | File | Changes |
|---|------|---------|
| 1 | `src/lib/preloadImages.ts` | Swap 8 `/images/*.png` → `.webp`, swap 5 `/Icons/*.png` → `.webp` (lowercase), keep 6 Icons that lack webp |
| 2 | `src/components/game/BonusTokens.tsx` | `RedSeal.png` → `redseal.webp`, `SilverSeal.png` → `silverseal.webp`, `GoldSeal.png` → `goldseal.webp` |
| 3 | `src/components/game/CargoObject.tsx` | 8 token imports `.png` → `.webp` |
| 4 | `src/components/game/TreasureStack.tsx` | 6 token imports `.png` → `.webp`, `Doubloon.png` → `doubloon.webp` |
| 5 | `src/components/game/GameBoard.tsx` | `BannerLogo.png` → `bannerlogo.webp`, `wood-bg.png` → `wood-bg.webp` |
| 6 | `src/components/game/HeroSection.tsx` | `Privateer.png` → `privateer.webp` |
| 7 | `src/components/game/AgeConsentModal.tsx` | `Privateer.png` → `privateer.webp` |
| 8 | `src/components/game/SetSailPanel.tsx` | 4 difficulty imports `.png` → `.webp` (deckhand → `deckHand.webp`) |
| 9 | `src/components/game/ScoreBoard.tsx` | `ledger-bg.png` → `.webp`, `doubloons.png` → `.webp`, `commissions.png` → `.webp`, `fleet.png` → `.webp` |
| 10 | `src/components/game/TradingPost.tsx` | `Claim.png` → `claim.webp`, `Trade.png` → `trade.webp`, `trading-post-bg.png` → `.webp`, `supply.png` → `.webp`, `fleet.png` → `.webp` |
| 11 | `src/components/game/ShipsHold.tsx` | `cargo-hold-bg.png` → `.webp`, `fleet.png` → `.webp` |
| 12 | `src/components/game/ActionNotification.tsx` | `Claim.png` → `claim.webp`, `Trade.png` → `trade.webp`, `Sell.png` → `sell.webp`, `Raid.png` → `raid.webp`, `Storm.png` → `storm.webp`, `fleet.png` → `.webp` |
| 13 | `src/components/game/RoundEndModal.tsx` | 3 seal `.png` → `.webp` (lowercase) |
| 14 | `src/components/game/HowToPlunder.tsx` | `Claim.png` → `claim.webp`, `Trade.png` → `trade.webp`, `Sell.png` → `sell.webp` |
| 15 | `src/components/game/layouts/PhoneLayout.tsx` | `supply.png` → `.webp`, `fleet.png` → `.webp` |
| 16 | `src/components/game/layouts/TabletLayout.tsx` | `supply.png` → `.webp`, `fleet.png` → `.webp` |
| 17 | `src/components/game/layouts/TreasureSupplyPanel.tsx` | `ledger-bg.png` → `.webp` |
| 18 | `src/pages/HowToPlay.tsx` | `BannerLogo.png` → `bannerlogo.webp`, 7 token imports `.png` → `.webp`, icon string refs → `.webp` where available |
| 19 | `index.html` | No change (hero-bg.jpg has no webp) |

**~19 files, ~80 individual path swaps. All straightforward find-and-replace.**

