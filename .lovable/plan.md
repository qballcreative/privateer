

## Overlay the Age Consent on the Landing Page

**Best approach: Render it as an overlay on top of the landing page** rather than replacing it. This way the player sees the hero section, logo, and game atmosphere behind a frosted backdrop — making it feel like part of the game world instead of a separate gate.

Additionally, add the Privateer logo above the "Welcome Aboard" heading inside the modal for branding continuity.

### Changes

**`LandingPage.tsx`** — Instead of early-returning `<AgeConsentModal />` when `!hasConsented`, render the full landing page and overlay the modal on top:

```tsx
// Remove the early return (lines 65-67)
// Instead, render AgeConsentModal at the end, conditionally:
return (
  <div className="min-h-screen flex flex-col relative">
    {/* ...existing landing page content... */}
    {!hasConsented && <AgeConsentModal />}
  </div>
);
```

**`AgeConsentModal.tsx`** — Add the Privateer logo above the title:

- Import `privateerLogo` from `@/assets/Privateer.png`
- Add an `<img>` (max-width ~12rem, centered) above the "Welcome Aboard" heading
- Keep the existing frosted backdrop (`bg-background/95 backdrop-blur-sm`) which will now show the landing page behind it

