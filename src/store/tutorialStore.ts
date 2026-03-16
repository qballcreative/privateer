/**
 * Tutorial Store — Interactive Onboarding Walkthrough
 *
 * Manages the state of the step-by-step tutorial that guides new players
 * through the game board. Each step can optionally spotlight a UI element
 * via a `highlightId` that matches a `data-tutorial-id` attribute in the DOM.
 *
 * The `hasSeenTutorial` flag is persisted so returning players aren't
 * shown the tutorial again. Only this flag is persisted — active tutorial
 * state (currentStep, isActive) resets on page reload.
 *
 * Persisted under the key 'plunder-tutorial'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** A single step in the tutorial walkthrough. */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** If set, the tutorial tooltip will spotlight the element with this data-tutorial-id. */
  highlightId?: string;
  /** If true, this step is only shown when the relevant optional rule is active. */
  optional?: boolean;
}

/**
 * The ordered list of tutorial steps. Each step introduces a key concept
 * of the game board, from the Trading Post to scoring to victory conditions.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: "Welcome, Captain!",
    description: "Let's learn how to trade, plunder, and earn your Letters of Marque. We'll walk you through the game board step by step.",
  },
  {
    id: 'trading-post',
    title: 'The Trading Post',
    description: 'This is the Trading Post — 5 cargo goods are laid out on the dock. Each turn you\'ll interact with these goods to build your fortune.',
    highlightId: 'tutorial-trading-post',
  },
  {
    id: 'actions',
    title: 'Actions: Claim & Trade',
    description: 'Use "Claim Cargo" to take 1 good from the dock, or "Trade Goods" to exchange 2+ goods from your Hold with the dock. Choose wisely!',
    highlightId: 'tutorial-actions',
  },
  {
    id: 'ships-hold',
    title: "Your Ship's Hold",
    description: 'This is your Captain\'s Hold — your personal cargo bay. Goods you claim end up here. You can hold up to 7 goods (ships don\'t count toward the limit).',
    highlightId: 'tutorial-ships-hold',
  },
  {
    id: 'sell-cargo',
    title: 'Sell Cargo',
    description: 'Select matching goods in your Hold and hit "Sell Cargo" to earn doubloon tokens. Sell 2+ at a time for premium goods, or 1 at a time for common goods.',
    highlightId: 'tutorial-ships-hold',
  },
  {
    id: 'market-prices',
    title: 'Market Prices',
    description: 'Each goods type has a stack of doubloon tokens. The top token is the most valuable — prices drop as goods are sold. Sell early for the best price!',
    highlightId: 'tutorial-market-prices',
  },
  {
    id: 'bonus-medallions',
    title: 'Commission Seals',
    description: 'Sell 3, 4, or 5+ goods at once to earn a bonus Commission Seal! These are worth extra doubloons — the more you sell at once, the bigger the bonus.',
    highlightId: 'tutorial-bonus',
  },
  {
    id: 'winning',
    title: 'Winning the Game',
    description: 'The round ends when the Trading Post supply is empty OR 3 token stacks are depleted. The captain with the most doubloons wins the round. Win the best-of series to earn your Letters of Marque!',
  },
  {
    id: 'ready',
    title: 'Ready to Sail! ⚓',
    description: 'You\'re ready, Captain! Close this guide and take your first action. Fair winds and following seas!',
  },
];

interface TutorialState {
  /** Whether the tutorial overlay is currently showing. */
  isActive: boolean;
  /** Zero-indexed current step in TUTORIAL_STEPS. */
  currentStep: number;
  /** Total number of tutorial steps (for progress indicator). */
  totalSteps: number;
  /** Whether the user has completed or skipped the tutorial at least once. */
  hasSeenTutorial: boolean;

  // ─── Actions ────────────────────────────────────────────────────
  /** Begin the tutorial from step 0. */
  start: () => void;
  /** Advance to the next step; completes the tutorial if on the last step. */
  next: () => void;
  /** Go back one step (clamped to step 0). */
  prev: () => void;
  /** Skip the tutorial entirely and mark it as seen. */
  skip: () => void;
  /** Mark the tutorial as complete. */
  complete: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      isActive: false,
      currentStep: 0,
      totalSteps: TUTORIAL_STEPS.length,
      hasSeenTutorial: false,
      start: () => set({ isActive: true, currentStep: 0 }),
      next: () => set((s) => {
        // If on last step, complete the tutorial
        if (s.currentStep >= TUTORIAL_STEPS.length - 1) {
          return { isActive: false, currentStep: 0, hasSeenTutorial: true };
        }
        return { currentStep: s.currentStep + 1 };
      }),
      prev: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
      skip: () => set({ isActive: false, currentStep: 0, hasSeenTutorial: true }),
      complete: () => set({ isActive: false, currentStep: 0, hasSeenTutorial: true }),
    }),
    {
      name: 'plunder-tutorial',
      // Only persist the "has seen" flag — tutorial progress resets on reload
      partialize: (state) => ({ hasSeenTutorial: state.hasSeenTutorial }),
    }
  )
);
