

## Fix: Bonus token animation showing for opponent sells

### Problem
The `UnloadChest` component listens to `lastAction` and triggers the bonus/doubloon animation whenever *any* player sells cargo. It should only animate when the **local human player** sells.

### Solution
In `UnloadChest.tsx`, compare `lastAction.playerName` against the `player.name` prop (which is always the human player since UnloadChest only renders for `isCurrentPlayer && !isOpponent`). If they don't match, skip the animation.

### Change
**`src/components/game/UnloadChest.tsx`** — line 138, add a guard check:

```tsx
// Before:
if (lastAction?.type === 'sell' && lastAction.cardsInvolved && lastAction !== processedAction.current) {

// After:
if (lastAction?.type === 'sell' && lastAction.cardsInvolved && lastAction !== processedAction.current && lastAction.playerName === player.name) {
```

Where `player.name` comes from the existing `player` prop (which has type `{ hand: Card[]; tokens: ...; bonusTokens: ... }`). We need to extend the prop type to include `name`:

**Update the `UnloadChestProps` interface** to include `name` in the player type:
```tsx
player: { name: string; hand: Card[]; tokens: { value: number }[]; bonusTokens: { value: number }[] };
```

This is a one-line guard addition — no other files need changes since `ShipsHold` already passes the full `Player` object which includes `name`.

