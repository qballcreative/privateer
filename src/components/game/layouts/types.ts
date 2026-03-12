import { GoodsType, Card, Token, BonusToken, Player } from '@/types/game';

import rumImg from '@/assets/tokens/rum.webp';
import ironImg from '@/assets/tokens/iron.webp';
import silverImg from '@/assets/tokens/silver.webp';
import goldImg from '@/assets/tokens/gold.webp';
import gemsImg from '@/assets/tokens/gems.webp';
import silkImg from '@/assets/tokens/silk.webp';

export const GOODS_ORDER: GoodsType[] = ['gemstones', 'gold', 'silver', 'silks', 'cannonballs', 'rum'];

export const GOODS_IMAGES: Record<GoodsType, string> = {
  gemstones: gemsImg,
  gold: goldImg,
  silver: silverImg,
  silks: silkImg,
  cannonballs: ironImg,
  rum: rumImg,
};

export interface TreasureSupplyPanelProps {
  compact?: boolean;
  tokenStacks: Record<GoodsType, Token[]>;
  bonusTokens: { three: BonusToken[]; four: BonusToken[]; five: BonusToken[] };
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
  treasureSupplyProps: TreasureSupplyPanelProps;
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
