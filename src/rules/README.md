# Rules Engine — Plug-in Architecture

The game's optional rules are powered by a **hook-based plug-in system**.  
Each rule is a plain object that conforms to the `RulePlugin` interface and can tap into any combination of lifecycle hooks — without touching the core engine.

---

## Quick start — adding a new rule

1. Create a file in `src/rules/`, e.g. `myRule.ts`.
2. Export an object that satisfies `RulePlugin`:

```ts
import { RulePlugin, TurnEndContext } from './RulesEngine';

export const myRule: RulePlugin = {
  id: 'my_rule',               // unique slug
  name: 'My Awesome Rule',     // shown in settings UI
  description: 'Does something cool every 5th turn.',
  enableByDefault: false,

  hooks: {
    onTurnEnd(ctx: TurnEndContext) {
      if (ctx.state.turnCount % 5 !== 0) return;
      // mutate ctx.state directly — the engine writes it back
      ctx.injectedAction = {
        type: 'storm',          // reuse an ActionType or add a new one
        playerName: 'My Rule',
        description: 'did something cool!',
      };
    },
  },
};
```

3. Register it in `src/rules/index.ts`:

```ts
export { myRule } from './myRule';
```

4. Register it in the engine instance (in `src/store/gameStore.ts`):

```ts
import { myRule } from '@/rules';
rulesEngine.register(myRule);
```

5. Map it to `OptionalRules` (in `src/types/game.ts`) so the settings UI can toggle it:

```ts
export interface OptionalRules {
  stormRule: boolean;
  pirateRaid: boolean;
  treasureChest: boolean;
  myRule: boolean;        // ← add here
}
```

6. Add the mapping in `gameStore.ts` inside `mapOptionalRulesToPluginIds()`:

```ts
if (rules.myRule) ids.push('my_rule');
```

That's it — no other files need to change.

---

## Available hooks

| Hook              | When it fires                                    | Context type         |
|-------------------|--------------------------------------------------|----------------------|
| `onGameStart`     | Once when a brand-new game begins                | `RuleContext`        |
| `onDeal`          | After cards are dealt at the start of each round  | `RuleContext`        |
| `onBeforeAction`  | Before a player action is applied (can cancel)    | `BeforeActionContext`|
| `onAfterAction`   | After a player action has been applied            | `AfterActionContext` |
| `onTurnStart`     | When a player's turn begins                       | `RuleContext`        |
| `onTurnEnd`       | After endTurn logic, before switching player       | `TurnEndContext`     |
| `onSell`          | When cards are sold (after tokens awarded)         | `SellContext`        |
| `onRoundEnd`      | When a round ends                                 | `RoundEndContext`    |
| `onGameEnd`       | When the entire game ends                         | `RuleContext`        |

### Cancelling an action

Inside `onBeforeAction`, set `ctx.cancelled = true` and optionally `ctx.cancelReason` to block the action and show feedback.

### Injecting notifications

Inside `onTurnEnd`, set `ctx.injectedAction` to display a custom action notification (e.g., the Storm rule).

### Mutating state

All hooks receive `ctx.state` — a mutable reference to the full `GameState`. Mutate it directly; the engine writes it back to the store after all hooks have run.

---

## Design principles

- **Zero coupling** — plugins know nothing about each other.
- **Declarative** — a plugin is just data + pure-ish functions.
- **Ordered** — hooks fire in registration order; first canceller wins.
- **Testable** — build a `RuleContext` manually and call `plugin.hooks.onX(ctx)`.

---

## Existing plugins

| id               | File                  | Summary                                              |
|------------------|-----------------------|------------------------------------------------------|
| `storm`          | `plugins.ts`          | Every 3rd turn, 2 random market goods are replaced   |
| `pirate_raid`    | `plugins.ts`          | Once-per-game steal from opponent's hold              |
| `treasure_chest` | `plugins.ts`          | Hidden bonus token revealed at round end              |
