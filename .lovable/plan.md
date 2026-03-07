

# PWA Setup + Platform Abstraction — Implementation Plan

## Overview

Install `vite-plugin-pwa` to generate the service worker and manifest. Add a platform detection module that routes native calls (ads, haptics) through adapters. Add a deferred install prompt on the landing page. Update README with Capacitor wrapping steps.

---

## New Files

### 1. `public/manifest.json` — Web app manifest
- `name`: "Privateer: Letters of Marque", `short_name`: "Privateer"
- `display`: "standalone", `orientation`: "portrait", `theme_color` / `background_color` matching the dark pirate theme
- `start_url`: "/", `scope`: "/"
- `icons`: reference `favicon.ico` at 48x48 and generate simple sized entries (192x192, 512x512) from the existing `src/assets/Logo.png` copied to `public/icons/`

### 2. `public/icons/icon-192x192.png` & `public/icons/icon-512x512.png`
- Copy `src/assets/Logo.png` to public as these icon sizes (will reference Logo.png directly since we can't resize at build time — vite-plugin-pwa can use the originals)

### 3. `src/lib/platform.ts` — Platform detection + native adapter routing
- `detectPlatform(): 'web' | 'pwa' | 'capacitor'` — checks `window.matchMedia('(display-mode: standalone)')` for PWA, checks `(window as any).Capacitor` for native wrapper, else `'web'`
- `NativeAdapter` interface with methods: `triggerHaptic(type: 'light' | 'medium' | 'heavy'): void`, plus re-exports ad provider routing
- `WebHapticsAdapter` — no-op
- `CapacitorHapticsAdapter` — calls `window.Capacitor?.Plugins?.Haptics?.impact()` if available, no-op fallback
- `createNativeAdapter()` factory based on detected platform
- Export singleton `platform` object with `type`, `haptics`, `isNative`, `isPWA`

### 4. `src/hooks/useInstallPrompt.ts` — Deferred PWA install prompt hook
- Listens for `beforeinstallprompt` event, stores it
- Tracks dismissal in localStorage key `privateer-install-dismissed` with a timestamp (suppress for 7 days after dismissal)
- Returns `{ canInstall, promptInstall, dismiss }`

### 5. `src/components/game/InstallPrompt.tsx` — Install banner on landing page
- Renders a subtle, dismissible banner at top of landing page when `canInstall` is true
- "Install Privateer" button calls `promptInstall()`; X button calls `dismiss()`
- Styled to match existing pirate/dark theme

## Modified Files

### 6. `vite.config.ts`
- Install and configure `vite-plugin-pwa`:
  - `registerType: 'autoUpdate'`
  - `workbox.globPatterns`: include HTML, JS, CSS, and image assets (`Icons/**`, `assets/**`)
  - `workbox.navigateFallbackDenylist`: `[/^\/~oauth/]`
  - `manifest` inline or reference `public/manifest.json`
  - `includeAssets`: `['favicon.ico', 'Icons/**', 'sounds/**']`

### 7. `index.html`
- Add `<link rel="manifest" href="/manifest.json">`
- Add `<meta name="theme-color" content="#1a1a2e">`
- Add apple-touch-icon link to `icons/icon-192x192.png`
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`

### 8. `src/components/game/LandingPage.tsx`
- Import and render `<InstallPrompt />` at the top of the page (before hero content)

### 9. `src/lib/adProvider.ts`
- Import `platform` from `platform.ts`
- `createAdProvider`: use platform detection to choose provider (Capacitor → NativeBridge, else Noop)

### 10. `README.md`
- Add "Capacitor Wrapping" section with steps:
  1. Export to GitHub, clone locally
  2. `npm install && npx cap init` with appId `app.lovable.6edb5750b7b04334b48af7ca61b6a67a`
  3. `npx cap add ios/android`
  4. `npm run build && npx cap sync`
  5. `npx cap run ios/android`
  6. Note: haptics adapter auto-activates when Capacitor is detected; ads route through NativeBridge when `window.NativeAds` is available

## Dependencies

- Add `vite-plugin-pwa` as a dev dependency

## Key Design Decisions

- **No custom service worker file** — vite-plugin-pwa generates it via Workbox config
- **Haptics are no-op on web/PWA** — the adapter pattern reserves the slot for Capacitor without importing Capacitor packages (which aren't installed yet)
- **Install prompt respects dismissals** — 7-day cooldown stored in localStorage
- **Platform detection is synchronous** — safe to call at module init

