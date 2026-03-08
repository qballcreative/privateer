

# Convert Card-Like Components to Object Tiles

## What Changes

Three components on the landing page still use card-like styling (`rounded-xl border-2`, `rounded-lg bg-muted/30`) that implies card edges. These need to become object tiles with cargo-slot aesthetics: inset shadows, wood/rope separators, no outer card borders.

## Files to Modify

### 1. `src/components/game/HowToPlunder.tsx`
- Remove `rounded-xl border-2 border-[hsl(var(--rope))]` card wrapper from each step
- Replace with cargo-slot tiles: `bg-[hsl(var(--wood-plank)/0.6)]` with `shadow-[var(--shadow-inset)]` (inset slot shadow)
- Replace the circular icon container with a square brass-plated slot
- Add a horizontal rope separator between icon and text (a thin `border-b border-[hsl(var(--rope))]` line)
- Section separator: replace `border-t border-border` with a wood/rope divider using a decorative `hr` with rope color

### 2. `src/components/game/VictoryConditions.tsx`
- Remove the outer `rounded-xl border-2 border-[hsl(var(--brass-light)/0.4)]` card wrapper
- Replace with a wood-plank panel: `bg-[hsl(var(--wood-plank))]` with `shadow-[var(--shadow-inset)]`
- Each condition row: remove `rounded-lg bg-muted/30` → use inset cargo slot style with wood separator between rows instead of gap spacing
- Icon containers: square slots instead of rounded-full

### 3. `src/components/game/SetSailPanel.tsx`
- Outer panel: keep the rope ring but swap `rounded-xl` to `rounded-lg`, add `shadow-[var(--shadow-inset)]` for recessed feel
- Mode buttons: remove `rounded-lg border-2` card look → use inset slot styling with `shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]` and wood background
- Option toggle buttons: same inset slot treatment, remove explicit border-2 card edges
- Action buttons: keep rope border but add wood-grain background texture class
- Add wood-grain separator lines (`border-t border-[hsl(var(--wood-plank-light))]`) between sections instead of `mb-6` spacing alone

### 4. `src/index.css` — Add utility class
```css
.cargo-slot {
  background: hsl(var(--wood-plank) / 0.6);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.4), inset 0 -1px 3px rgba(0,0,0,0.2);
}
.wood-separator {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, hsl(var(--rope)), transparent);
}
```

