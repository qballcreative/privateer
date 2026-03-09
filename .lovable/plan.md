

## Replace Treasure Chest with Victory Video

Copy the uploaded video to the project and replace the `TreasureChest` component with a `<video>` element that autoplays and freezes on its last frame.

### Steps

1. **Copy video**: `user-uploads://Chest_-_SD_480p.mov` → `public/videos/victory.mov`

2. **Update `src/components/game/VictoryScreen.tsx`**:
   - Remove the `TreasureChest` component (lines 50–150)
   - Replace its usage (lines 215–218) with a `<video>` element:
     ```tsx
     <motion.div
       initial={{ scale: 0, opacity: 0 }}
       animate={{ scale: 1, opacity: 1 }}
       transition={{ type: 'spring', stiffness: 200, damping: 15 }}
       className="relative z-10 mx-auto mb-3"
     >
       <video
         src="/videos/victory.mov"
         autoPlay
         muted
         playsInline
         className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-lg object-cover"
         onEnded={(e) => {
           const v = e.currentTarget;
           v.currentTime = Math.max(0, v.duration - 0.01);
           v.pause();
         }}
       />
     </motion.div>
     ```
   - Add `useRef` import (not strictly needed since we use the event target)
   - Keep `GoldParticle` confetti, `VoyageIndicator`, score breakdown, and buttons unchanged
   - For defeats (`!isPlayerVictory`), show a static defeated icon (e.g., the existing `Anchor` icon) instead of the video

### Files

| File | Action |
|------|--------|
| `public/videos/victory.mov` | Copy from upload |
| `src/components/game/VictoryScreen.tsx` | Remove TreasureChest, add video element |

