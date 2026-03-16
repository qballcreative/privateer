/**
 * Score Calculation — Privateer: Letters of Marque
 *
 * Computes a player's total score by summing:
 *  1. Doubloon tokens earned from selling goods
 *  2. Bonus commission seals earned from multi-card sells
 *  3. Largest fleet bonus (5 doubloons to the player with the most ships,
 *     only if they are the sole leader — no bonus on ties)
 *
 * Used by the ScoreBoard UI, the round-end winner calculation in gameStore,
 * and the AI's score-aware decision making in aiPlayer.ts.
 */

import { Player } from '@/types/game';

/**
 * Break down a player's score into its three components.
 *
 * @param player     - The player to score.
 * @param allPlayers - All players in the game (needed for fleet bonus comparison).
 * @returns An object with tokenScore, bonusScore, shipBonus, and total.
 */
export const getScoreBreakdown = (player: Player, allPlayers: Player[]) => {
  // Sum of all doubloon tokens earned from selling goods
  const tokenScore = player.tokens.reduce((sum, t) => sum + t.value, 0);

  // Sum of all bonus commission seals earned from selling 3+ cards at once
  const bonusScore = player.bonusTokens.reduce((sum, t) => sum + t.value, 0);

  // Largest fleet bonus: 5 doubloons to the sole player with the most ships
  let shipBonus = 0;
  if (allPlayers.length > 1) {
    const maxShips = Math.max(...allPlayers.map((p) => p.ships.length));
    if (player.ships.length > 0 && player.ships.length === maxShips) {
      // Only award if exactly one player has the most ships (no ties)
      const playersWithMax = allPlayers.filter((p) => p.ships.length === maxShips).length;
      if (playersWithMax === 1) shipBonus = 5;
    }
  }

  return { tokenScore, bonusScore, shipBonus, total: tokenScore + bonusScore + shipBonus };
};
