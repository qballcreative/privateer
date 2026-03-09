// Shared preload images used by LandingPage and GameBoard
export const PRELOAD_IMAGES = [
  '/images/doubloons.png', '/images/commissions.png', '/images/fleet.png',
  '/images/supply.png', '/images/ledger-bg.png', '/images/trading-post-bg.png',
  '/images/cargo-hold-bg.png', '/images/wood-bg.png',
  '/Icons/Doubloon.png', '/Icons/rum.png', '/Icons/cannonballs.png',
  '/Icons/silks.png', '/Icons/silver.png', '/Icons/gold.png', '/Icons/gemstones.png',
  '/Icons/RedSeal.png', '/Icons/SilverSeal.png', '/Icons/GoldSeal.png',
  '/Icons/Claim.png', '/Icons/Trade.png',
];

// Preload images when this module is imported
export const preloadImages = () => {
  PRELOAD_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};
