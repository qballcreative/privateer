

## Plan: Replace gradient doubloons with uploaded Doubloon image

### Changes

**1. Copy asset**
- Copy `user-uploads://Doubloon.png` to `public/Icons/Doubloon.png`

**2. Update `src/components/game/TreasureStack.tsx`**
- Replace the gradient circle (`bg-gradient-to-br`, `rounded-full`, `border-2`, `doubloon`, `gradientClass`, `coinColor`) with an `<img>` tag using `/Icons/Doubloon.png` as the doubloon background
- Overlay the token value number centered inside the doubloon image
- Keep the cargo type icon badge in the top-right corner (existing pattern)
- Maintain the stacking offset effect (`bottom: index * 3`)
- For empty state, show the doubloon image at reduced opacity
- Remove `gradientClass` and `coinColor` from the config since they're no longer needed

### Structure of each stacked coin
```
<motion.div style={positioning}>
  <img src="/Icons/Doubloon.png" class="w-11 h-11" />
  <!-- On top coin only: -->
  <span class="absolute centered">{value}</span>
  <div class="absolute top-right icon-badge">{icon}</div>
</motion.div>
```

### Files
- **Copy**: `user-uploads://Doubloon.png` → `public/Icons/Doubloon.png`
- **Modify**: `src/components/game/TreasureStack.tsx`

