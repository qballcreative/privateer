

# Fix Clipped "Trading Post" and "Supply" Labels

## Problem
The Trading Post container at line 135 has `overflow-hidden`, but the "Trading Post" label (line 140: `absolute -top-3`) and "Supply" indicator (line 148 area: `absolute -top-3 right-4`) are positioned above the container using negative top offsets. The `overflow-hidden` clips them.

## Solution
In `src/components/game/TradingPost.tsx`, change `overflow-hidden` to `overflow-visible` on the main container (line 135), and add top margin/padding to compensate for the protruding labels:

- Line 135: Replace `overflow-hidden` with `overflow-visible`
- Add `mt-4` to the container so the labels have room above it

One-line change, single file.

