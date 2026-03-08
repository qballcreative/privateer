

## Instant Game Board + Better Caching

### Problem
1. **Staggered loading feel**: The game board panels animate in with different delays (0.2s, 0.3s, 0.4s) via Framer Motion `initial`/`animate`, making elements appear one-by-one in a haphazard way.
2. **Asset caching**: The service worker already caches JS/CSS/images, but there's room to improve with explicit cache headers and ensuring all game assets are pre-cached on first visit.

### Solution

**1. "Ready gate" pattern — render everything at once**

Add a `ready` state that waits until game data is hydrated, then reveal the entire board in one coordinated fade-in instead of staggered panel animations.

- Wrap the board content in a single container that starts hidden (`opacity: 0`)
- Use a brief `useEffect` (single `requestAnimationFrame`) to flip `ready` to `true`
- When ready, fade the entire board in together — one smooth 300ms transition
- Remove the individual `initial={{ opacity: 0, x/y }}` and `transition={{ delay }}` from the tablet and desktop layout `motion.aside`/`motion.main` elements
- Keep the `motion.div` wrappers but set `initial={false}` so they render immediately without entry animations

**2. Enhanced asset caching**

- **Eager service worker caching**: The Workbox config already caches `**/*.{js,css,html,ico,png,jpg,svg,webp}`. This is solid.
- **Runtime caching strategy**: Add a Workbox `runtimeCaching` rule for image assets with a `CacheFirst` strategy so repeat visits load images from disk cache instantly.
- **Preload critical game images**: Move the `PRELOAD_IMAGES` array into a shared module and trigger preloading earlier — when the user is still on the landing page (during the "Set Sail" phase), not after the GameBoard mounts.

### Files to modify

| File | Change |
|------|--------|
| `src/components/game/GameBoard.tsx` | Remove staggered `delay`/`initial` animations from layout panels; add single coordinated reveal gate |
| `src/components/game/LandingPage.tsx` | Preload game board images when user is on landing page |
| `vite.config.ts` | Add `runtimeCaching` with `CacheFirst` for `/images/` and `/Icons/` paths |

### Detail

**GameBoard.tsx changes:**
- Add `const [ready, setReady] = useState(false)` + `useEffect(() => { requestAnimationFrame(() => setReady(true)); }, [])`
- Wrap the board in a `div` with `style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.3s ease-in' }}`
- Replace all `motion.aside` / `motion.main` with plain `aside` / `main` (or keep `motion.*` but with `initial={false}`)
- Keep gameplay animations (card moves, turn banners, etc.) — only remove the layout entry stagger

**LandingPage.tsx changes:**
- Import and trigger image preloading at module level (same `PRELOAD_IMAGES` list)

**vite.config.ts changes:**
- Add `runtimeCaching` to the VitePWA config for CacheFirst on image assets

