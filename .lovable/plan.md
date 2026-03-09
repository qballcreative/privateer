

## Multiplayer Disconnect Detection — Bug Analysis & Fix Plan

### Problem

The DisconnectModal only activates when **all three** conditions are true:
1. `isMultiplayer === true`
2. `multiplayerState === 'disconnected'`
3. `phase === 'playing'`

This means if a player leaves during `roundEnd` or `gameEnd` phases, or if the PeerJS signaling server disconnects (which fires `peer.on('disconnected')`) but the data channel stays briefly alive, the remaining player is never notified.

Additionally, the heartbeat mechanism (3s interval, 3 missed = 9s timeout) correctly detects connection loss, but the modal's phase gate blocks it from surfacing outside of active play.

### Root Causes

1. **Phase gate too narrow** — The modal ignores disconnects during `roundEnd` phase, where players are between rounds and the opponent may have quit.
2. **No "opponent left" message** — When a player deliberately leaves (Return to Port, close tab), no explicit "I'm leaving" message is sent to the opponent. Detection relies entirely on heartbeat timeout (~9 seconds of silence before the modal appears).
3. **Claim Victory resets to lobby** — `handleClaimVictory` calls `onResetGame()` which goes back to lobby instead of showing the Victory Screen with a proper win recorded.

### Plan

#### 1. Send explicit "leave" message on intentional exit
- In `GameBoard.tsx`, when the player clicks "Return to Port" or navigates away during a multiplayer game, send a `{ type: 'action', payload: { action: 'forfeit' } }` message before disconnecting.
- Add a `beforeunload` event listener that sends this forfeit message when the tab is closed.

#### 2. Handle incoming forfeit message
- In the GameBoard message handler, listen for the `forfeit` action type.
- When received, immediately show the DisconnectModal with `disconnectTimer` already at 30 (skip the wait), or directly trigger victory for the remaining player.

#### 3. Expand phase gate in DisconnectModal
- Change the condition from `phase === 'playing'` to `phase === 'playing' || phase === 'roundEnd'` so disconnects between rounds are also caught.

#### 4. Show Victory Screen on Claim Victory
- Instead of resetting to lobby, route `handleClaimVictory` through the game store to set the game phase to `gameEnd` with the local player as winner, so the standard Victory Screen displays with the win properly recorded.

### Files to modify

| File | Change |
|------|--------|
| `src/components/game/DisconnectModal.tsx` | Expand phase gate; support instant claim on forfeit; route claim to victory screen instead of lobby |
| `src/components/game/GameBoard.tsx` | Send forfeit message on exit; add `beforeunload` listener; handle incoming forfeit in message handler |
| `src/store/multiplayerStore.ts` | Add `sendForfeit()` convenience method that sends forfeit then disconnects |
| `src/store/gameStore.ts` | Add `claimVictory(winnerIndex)` action that sets phase to `gameEnd` with proper round-win recording |

