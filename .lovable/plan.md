

## Code Cleanup & Dead Code Removal

### Summary
After thorough analysis, I found several unused files/components and minor code quality issues. Below is a comprehensive cleanup plan.

---

### Unused Files to Delete

| File | Status | Reason |
|------|--------|--------|
| `src/components/NavLink.tsx` | **DELETE** | Never imported anywhere in the codebase |
| `src/components/game/TokenStack.tsx` | **DELETE** | Never imported — `TreasureStack.tsx` is used instead |
| `src/components/game/GameCard.tsx` | **DELETE** | Never imported — `CargoObject.tsx` is used instead |
| `src/components/game/Market.tsx` | **DELETE** | Never imported — `TradingPost.tsx` is used instead |
| `src/components/game/PlayerHand.tsx` | **DELETE** | Never imported — hand logic lives in `ShipsHold.tsx` |
| `src/pages/TutorialPage.tsx` | **DELETE** | Never routed — no route in `App.tsx`, tutorial uses `Tutorial.tsx` component instead |

---

### Files to Keep (Confirmed in Use)

| File | Usage |
|------|-------|
| `src/lib/platform.ts` | Used by `adProvider.ts` |
| `src/lib/debugLog.ts` | Used by Rules Engine, validateGameState, DebugPanel |
| `src/lib/security.ts` | Used by `multiplayerStore.ts` |
| `src/rules/RulesEngine.ts` + `plugins.ts` | Used by `gameStore.ts` |

---

### Technical Details

**Analysis Method:**
1. Searched for import statements across all `.tsx`/`.ts` files
2. Cross-referenced exports with imports
3. Verified routes in `App.tsx`
4. Confirmed components actually rendered in the component tree

**Files confirmed unused:**
- `NavLink.tsx`: 0 imports found via `from '@/components/NavLink'`
- `TokenStack.tsx`: 0 imports (GameBoard uses `TreasureStack`)
- `GameCard.tsx`: 0 imports (UI uses `CargoObject`)
- `Market.tsx`: 0 imports (GameBoard uses `TradingPost`)
- `PlayerHand.tsx`: 0 imports (hand display is integrated into `ShipsHold`)
- `TutorialPage.tsx`: No route defined, not lazy-loaded anywhere

---

### Implementation

Delete 6 files with no code changes needed elsewhere — all are orphaned with no dependents.

