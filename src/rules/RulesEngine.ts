import {
  Card,
  Player,
  Token,
  BonusToken,
  GoodsType,
  ActionDisplay,
  GameState,
  OptionalRules,
} from '@/types/game';

// ─── Hook context shapes ────────────────────────────────────────────

/** Mutable snapshot the engine hands to every hook. */
export interface RuleContext {
  /** Full mutable game state — hooks may read and mutate freely. */
  state: GameState;
  /** Index of the player whose turn it is. */
  currentPlayerIndex: 0 | 1;
  /** Convenience accessor. */
  currentPlayer: Player;
  /** Convenience accessor. */
  opponent: Player;
  /** Push an action display to show the player what happened. */
  pushAction: (action: ActionDisplay) => void;
  /** Utility: cryptographically-secure shuffle. */
  shuffle: <T>(arr: T[]) => T[];
  /** Utility: generate a secure unique id. */
  generateId: () => string;
}

export interface BeforeActionContext extends RuleContext {
  /** The action type the player is attempting. */
  actionType: 'take' | 'take-ships' | 'exchange' | 'sell' | 'raid';
  /** Set to `true` inside a hook to block the action. */
  cancelled: boolean;
  /** Optional reason shown to the player when cancelled. */
  cancelReason?: string;
}

export interface AfterActionContext extends RuleContext {
  /** The action that was just completed. */
  action: ActionDisplay;
}

export interface SellContext extends RuleContext {
  /** Cards being sold. */
  soldCards: Card[];
  /** Tokens awarded. */
  tokensAwarded: Token[];
  /** Bonus token awarded (if any). */
  bonusAwarded?: BonusToken;
}

export interface TurnEndContext extends RuleContext {
  /** Current turn number (0-indexed, incremented *before* this hook fires). */
  turnCount: number;
  /** If a hook sets this, the action notification will display it. */
  injectedAction?: ActionDisplay;
}

export interface RoundEndContext extends RuleContext {
  /** The round that just ended. */
  round: number;
}

// ─── Rule plug-in shape ─────────────────────────────────────────────

export interface RulePlugin {
  /** Unique identifier, e.g. "storm" */
  id: string;
  /** Human-readable name. */
  name: string;
  /** One-sentence description shown in settings UI. */
  description: string;
  /** If true the rule is on by default in new games. */
  enableByDefault?: boolean;

  hooks: {
    /** Called once when a new game (not round) starts. */
    onGameStart?: (ctx: RuleContext) => void;
    /** Called after cards are dealt at the start of a round. */
    onDeal?: (ctx: RuleContext) => void;
    /** Called before a player action is applied. Can cancel. */
    onBeforeAction?: (ctx: BeforeActionContext) => void;
    /** Called after a player action has been applied. */
    onAfterAction?: (ctx: AfterActionContext) => void;
    /** Called when a player's turn begins. */
    onTurnStart?: (ctx: RuleContext) => void;
    /** Called after endTurn logic, before switching player. */
    onTurnEnd?: (ctx: TurnEndContext) => void;
    /** Called when cards are sold (after tokens awarded). */
    onSell?: (ctx: SellContext) => void;
    /** Called when a round ends. */
    onRoundEnd?: (ctx: RoundEndContext) => void;
    /** Called when the entire game ends. */
    onGameEnd?: (ctx: RuleContext) => void;
  };
}

// ─── Rules engine ───────────────────────────────────────────────────

export class RulesEngine {
  private plugins: RulePlugin[] = [];
  private enabledIds: Set<string> = new Set();

  /** Register a plugin. */
  register(plugin: RulePlugin): void {
    if (this.plugins.some((p) => p.id === plugin.id)) {
      console.warn(`[RulesEngine] Plugin "${plugin.id}" already registered — skipping.`);
      return;
    }
    this.plugins.push(plugin);
  }

  /** Set which rule ids are enabled for this game session. */
  setEnabled(ids: string[]): void {
    this.enabledIds = new Set(ids);
  }

  /** Enable a single rule by id. */
  enable(id: string): void {
    this.enabledIds.add(id);
  }

  /** Disable a single rule by id. */
  disable(id: string): void {
    this.enabledIds.delete(id);
  }

  /** Get all registered plugins. */
  getPlugins(): readonly RulePlugin[] {
    return this.plugins;
  }

  /** Get only the currently enabled plugins. */
  private active(): RulePlugin[] {
    return this.plugins.filter((p) => this.enabledIds.has(p.id));
  }

  // ─── Hook dispatchers ──────────────────────────────────────────

  fireGameStart(ctx: RuleContext): void {
    for (const p of this.active()) p.hooks.onGameStart?.(ctx);
  }

  fireDeal(ctx: RuleContext): void {
    for (const p of this.active()) p.hooks.onDeal?.(ctx);
  }

  fireBeforeAction(ctx: BeforeActionContext): void {
    for (const p of this.active()) {
      p.hooks.onBeforeAction?.(ctx);
      if (ctx.cancelled) break; // stop once cancelled
    }
  }

  fireAfterAction(ctx: AfterActionContext): void {
    for (const p of this.active()) p.hooks.onAfterAction?.(ctx);
  }

  fireTurnStart(ctx: RuleContext): void {
    for (const p of this.active()) p.hooks.onTurnStart?.(ctx);
  }

  fireTurnEnd(ctx: TurnEndContext): void {
    for (const p of this.active()) p.hooks.onTurnEnd?.(ctx);
  }

  fireSell(ctx: SellContext): void {
    for (const p of this.active()) p.hooks.onSell?.(ctx);
  }

  fireRoundEnd(ctx: RoundEndContext): void {
    for (const p of this.active()) p.hooks.onRoundEnd?.(ctx);
  }

  fireGameEnd(ctx: RuleContext): void {
    for (const p of this.active()) p.hooks.onGameEnd?.(ctx);
  }
}
