

## Plan: Sync AI turn delay with action notification duration

### Problem
The AI plays its turn after a fixed 1-second delay (`setTimeout(() => get().makeAIMove(), 1000)`), but the action notification displays for `actionNotificationDuration` seconds (default 3s). This means the AI acts before the player can see what happened.

### Solution
In `src/store/gameStore.ts` line 722, replace the hardcoded 1000ms delay with the `actionNotificationDuration` from `settingsStore`, plus a small buffer (e.g. 500ms) so the notification fully fades before the AI moves.

### Changes

**`src/store/gameStore.ts`** (line 722):
```typescript
// Before:
setTimeout(() => get().makeAIMove(), 1000);

// After:
const notifDuration = useSettingsStore.getState().actionNotificationDuration;
setTimeout(() => get().makeAIMove(), (notifDuration * 1000) + 500);
```

Import `useSettingsStore` at the top of the file (if not already imported).

### Files to modify
- `src/store/gameStore.ts` — 1 line change + possible import addition

