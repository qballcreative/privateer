/**
 * Image Preloader — Eagerly loads critical game images into the browser cache.
 * Called from both LandingPage and GameBoard so assets are ready before gameplay.
 */
export const PRELOAD_IMAGES = [
  '/images/doubloons.webp', '/images/commissions.webp', '/images/fleet.webp',
  '/images/supply.webp', '/images/ledger-bg.webp', '/images/trading-post-bg.webp',
  '/images/cargo-hold-bg.webp', '/images/wood-bg.webp',
  '/Icons/doubloon.webp', '/Icons/rum.png', '/Icons/cannonballs.png',
  '/Icons/silks.png', '/Icons/silver.png', '/Icons/gold.png', '/Icons/gemstones.png',
  '/Icons/redseal.webp', '/Icons/silverseal.webp', '/Icons/goldseal.webp',
  '/Icons/claim.webp', '/Icons/trade.webp',
];

// Preload images when this module is imported
export const preloadImages = () => {
  PRELOAD_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};
