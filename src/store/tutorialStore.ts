import { create } from 'zustand';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightId?: string; // data-tutorial-id on the element to spotlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  optional?: boolean; // for optional-rule steps
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: "Welcome, Captain!",
    description: "Let's learn how to trade, plunder, and earn your Letters of Marque. We'll walk through a mock game board step by step.",
  },
  {
    id: 'trading-post',
    title: 'The Trading Post',
    description: 'This is the Trading Post — 5 cargo goods are laid out on the dock. Each turn you\'ll interact with these goods.',
    highlightId: 'tutorial-trading-post',
    position: 'bottom',
  },
  {
    id: 'ships-hold',
    title: "Your Ship's Hold",
    description: 'This is your Ship\'s Hold — your personal cargo bay. Goods you claim end up here. You can hold up to 7 goods (ships don\'t count toward the limit).',
    highlightId: 'tutorial-ships-hold',
    position: 'top',
  },
  {
    id: 'market-prices',
    title: 'Market Prices',
    description: 'Each goods type has a stack of doubloon tokens. The top token is the most valuable — prices drop as goods are sold. Sell early for the best price!',
    highlightId: 'tutorial-market-prices',
    position: 'bottom',
  },
  {
    id: 'claim-cargo',
    title: 'Action: Claim Cargo',
    description: 'Take 1 good from the Trading Post and add it to your Hold. The empty slot is refilled from the Trading Post supply. Simple and effective!',
    highlightId: 'tutorial-claim',
    position: 'bottom',
  },
  {
    id: 'commandeer-fleet',
    title: 'Action: Commandeer Fleet',
    description: 'Take ALL ships from the Trading Post at once! Ships don\'t count toward your hand limit and the player with the most ships earns 5 bonus doubloons.',
    highlightId: 'tutorial-commandeer',
    position: 'bottom',
  },
  {
    id: 'trade-goods',
    title: 'Action: Trade Goods',
    description: 'Exchange 2 or more goods between your Hold and the Trading Post. You can use ships from your fleet as part of the trade. Great for upgrading cheap goods to expensive ones!',
    highlightId: 'tutorial-trade',
    position: 'bottom',
  },
  {
    id: 'sell-cargo',
    title: 'Action: Sell Cargo',
    description: 'Sell 2+ matching goods from your Hold to earn doubloon tokens. For premium goods (gold, silver, gemstones), you must sell at least 2. For common goods (rum, cannonballs, silks), you can sell just 1.',
    highlightId: 'tutorial-sell',
    position: 'bottom',
  },
  {
    id: 'bonus-medallions',
    title: 'Commission Seals',
    description: 'Sell 3, 4, or 5+ goods at once to earn a bonus Commission Seal! These are worth extra doubloons — the more you sell at once, the bigger the bonus.',
    highlightId: 'tutorial-bonus',
    position: 'top',
  },
  {
    id: 'hand-limit',
    title: 'Hand Limit',
    description: 'Your Hold can carry at most 7 goods (ships don\'t count). If you\'re full, you\'ll need to sell or trade before claiming more cargo.',
    highlightId: 'tutorial-ships-hold',
    position: 'top',
  },
  {
    id: 'storm-rule',
    title: 'Optional: Storm Rule ⛈️',
    description: 'When enabled, every 3rd turn a storm hits! 2 random goods are swept from the Trading Post and replaced from the Supply Ship. Keep your plans flexible!',
    highlightId: 'tutorial-storm',
    position: 'bottom',
    optional: true,
  },
  {
    id: 'pirate-raid',
    title: 'Optional: Pirate Raid 🏴‍☠️',
    description: 'Once per game, you can raid your opponent\'s Hold and steal 1 random cargo! Use it wisely — you only get one shot.',
    highlightId: 'tutorial-raid',
    position: 'bottom',
    optional: true,
  },
  {
    id: 'treasure-chest',
    title: 'Optional: Treasure Chest 💰',
    description: 'At the end of each round, a hidden treasure chest is revealed with bonus doubloons! An exciting surprise that can swing the outcome.',
    highlightId: 'tutorial-treasure',
    position: 'bottom',
    optional: true,
  },
  {
    id: 'winning',
    title: 'Winning the Game',
    description: 'The round ends when the Supply Ship is empty OR 3 token stacks are depleted. The captain with the most doubloons wins the round. Win the best-of series to earn your Letters of Marque!',
  },
  {
    id: 'ready',
    title: 'Ready to Sail!',
    description: 'You\'re ready to set sail, Captain! Head back to the main page and start your first voyage. Fair winds and following seas! ⚓',
  },
];

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isActive: false,
  currentStep: 0,
  totalSteps: TUTORIAL_STEPS.length,
  start: () => set({ isActive: true, currentStep: 0 }),
  next: () => set((s) => {
    if (s.currentStep >= TUTORIAL_STEPS.length - 1) return { isActive: false, currentStep: 0 };
    return { currentStep: s.currentStep + 1 };
  }),
  prev: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  skip: () => set({ isActive: false, currentStep: 0 }),
  complete: () => set({ isActive: false, currentStep: 0 }),
}));
