import { GoodsType, Card, Token, BonusToken, Player } from '@/types/game';

export const GOODS_ORDER: GoodsType[] = ['gemstones', 'gold', 'silver', 'silks', 'cannonballs', 'rum'];

export interface TreasureSupplyPanelProps {
  compact?: boolean;
  tokenStacks: Record<GoodsType, Token[]>;
  bonusTokens: { three: BonusToken[]; four: BonusToken[]; five: BonusToken[] };
  optionalRules: { pirateRaid?: boolean; stormRule?: boolean; treasureChest?: boolean };
  currentPlayerIndex: number;
  localPlayerIndex: number;
  phase: string;
  humanPlayer: Player;
  currentPlayer: Player;
  canUsePirateRaid: () => boolean;
  isRaidMode: boolean;
  setIsRaidMode: (v: boolean) => void;
}

export interface OpponentPanelProps {
  opponentPlayer: Player | undefined;
  currentPlayerIndex: number;
  isRaidMode: boolean;
  onRaidCard: (card: Card) => void;
  isPondering?: boolean;
  optionalRules: { pirateRaid?: boolean; stormRule?: boolean; treasureChest?: boolean };
  localPlayerIndex: number;
  phase: string;
  humanPlayer: Player;
  currentPlayer: Player;
  canUsePirateRaid: () => boolean;
  setIsRaidMode: (v: boolean) => void;
}

export interface LayoutProps {
  treasureSupplyProps: Omit<TreasureSupplyPanelProps, 'isRaidMode' | 'setIsRaidMode'>;
  opponentPanelProps: OpponentPanelProps;
  isRaidMode: boolean;
  setIsRaidMode: (v: boolean) => void;
  isExchangeMode: boolean;
  setIsExchangeMode: (v: boolean) => void;
  triggerInvalidAction: () => void;
  humanPlayer: Player;
  opponentPlayer: Player | undefined;
  currentPlayerIndex: number;
  localPlayerIndex: number;
  opponentIndex: number;
  phase: string;
  isOpponentPondering: boolean;
  // Phone-specific
  deck: any[];
  tokenStacks: Record<GoodsType, Token[]>;
  turnCount: number;
  optionalRules: { pirateRaid?: boolean; stormRule?: boolean; treasureChest?: boolean };
  treasureDrawerOpen: boolean;
  setTreasureDrawerOpen: (v: boolean) => void;
  opponentDrawerOpen: boolean;
  setOpponentDrawerOpen: (v: boolean) => void;
  tradingPostCollapsed: boolean;
  setTradingPostCollapsed: (v: boolean) => void;
  handlePirateRaid: (card: Card) => void;
  players: Player[];
}
