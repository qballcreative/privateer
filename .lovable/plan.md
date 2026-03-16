

# Smarter AI: Lookahead, Score Awareness, and Endgame Strategy

## What Changes

The current AI evaluates each move independently using weighted heuristics. At **hard** and **expert** difficulty, we'll add three new strategic layers:

### 1. Score-Aware Decision Making
The AI will compute its own score vs. opponents every turn using the existing `getScoreBreakdown` function. When **ahead**, it shifts strategy toward actions that deplete token stacks (triggering the 3-empty-stacks round-end condition) or exhaust the deck. When **behind**, it prioritizes high-value plays and bonus token pursuits.

### 2. Endgame Acceleration / Stalling
- **When ahead**: Boost scores for selling even small sets (depletes stacks faster), taking cards from near-empty stacks, and taking ships (thins the deck). Add an `endgameUrgency` weight to expert/hard tiers.
- **When behind**: Penalize actions that would deplete stacks. Prefer hoarding for big bonus sells. Delay sells until maximum value is reached.

### 3. Opponent-Aware Lookahead (Expert only)
- Track what the opponent is likely collecting (cards in hand by type).
- If the opponent is 1-2 cards away from a 5-card bonus sell, prioritize taking/raiding those card types from the market to deny them.
- If optional rules are active: factor in storm disruption (don't hoard types that are scarce in market), save pirate raid for high-impact moments (opponent near a big sell), and account for treasure chest variance.

## Technical Approach

**File: `src/lib/aiPlayer.ts`**

1. **Import `getScoreBreakdown`** from `scoring.ts` — already available.

2. **Expand `DIFFICULTY_WEIGHTS`** with new fields:
   - `endgameAwareness` (0 for easy/medium, 0.8 for hard, 1.5 for expert)
   - `opponentModeling` (0 for easy/medium/hard, 1.0 for expert)
   - `raidTiming` (0 for easy, 0.5 medium, 1.0 hard/expert) — save raid for high-impact moments

3. **Add `evaluateScorePosition` helper** — returns a factor (-1 to +1) indicating how far ahead/behind the AI is relative to the best opponent.

4. **Add `evaluateEndgameImpact` helper** — scores how much an action accelerates or delays round end:
   - Selling cards that would empty a token stack → high score when ahead
   - Taking from near-empty stacks → positive when ahead
   - Penalize stack-depleting actions when behind

5. **Add `evaluateOpponentThreat` helper (expert only)** — scans opponent hands for near-complete sets (3+ of a type), returns blocking urgency score for market cards and raid targets of that type.

6. **Modify raid timing** — at expert, don't raid immediately; save it for when an opponent is about to sell a 4+ card set (high blocking value). At lower difficulties, use it opportunistically as today.

7. **Apply modifiers in `computeAIMove`** — after generating all candidate actions, apply score-position and endgame modifiers to each `ScoredAction.score` before sorting.

## Difficulty Behavior Summary

```text
              Easy    Medium    Hard      Expert
──────────────────────────────────────────────────
Score watch    No       No      Yes        Yes
Endgame push   No       No      Yes        Yes (aggressive)
Opp modeling   No       No      Partial    Full
Raid timing    Random   Basic   Smart      Optimal
Randomness     50%      25%     10%        0%
```

## What Stays the Same
- All existing heuristics (token urgency, blocking, bonus pursuit, sell timing) remain and continue to work.
- The `AIGameView` interface gains no new fields — score calculation uses the existing `players` array.
- No changes to game store, rules engine, or UI.

