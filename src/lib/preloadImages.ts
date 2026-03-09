// Shared preload images used by LandingPage and GameBoard
export const PRELOAD_IMAGES = [
  '/images/doubloons.webp', '/images/commissions.webp', '/images/fleet.webp',
  '/images/supply.webp', '/images/ledger-bg.webp', '/images/trading-post-bg.webp',
  '/images/cargo-hold-bg.webp', '/images/wood-bg.webp',
  '/Icons/Doubloon.webp', '/Icons/rum.webp', '/Icons/cannonballs.webp',
  '/Icons/silks.webp', '/Icons/silver.webp', '/Icons/gold.webp', '/Icons/gemstones.webp',
  '/Icons/RedSeal.webp', '/Icons/SilverSeal.webp', '/Icons/GoldSeal.webp',
  '/Icons/Claim.webp', '/Icons/Trade.webp',
];

// Preload images when this module is imported
export const preloadImages = () => {
  PRELOAD_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};
