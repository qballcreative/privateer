/**
 * Rules Module — Public API
 *
 * Re-exports the RulesEngine class, all hook context types, and the three
 * built-in optional rule plugins (Storm, Pirate Raid, Treasure Chest).
 * Import everything rules-related from '@/rules' for convenience.
 */

export { RulesEngine } from './RulesEngine';
export type {
  RulePlugin,
  RuleContext,
  BeforeActionContext,
  AfterActionContext,
  SellContext,
  TurnEndContext,
  RoundEndContext,
} from './RulesEngine';

export { stormRule, pirateRaidRule, treasureChestRule } from './plugins';
