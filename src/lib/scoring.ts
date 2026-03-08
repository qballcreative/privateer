import { Player } from '@/types/game';

/** Break down a player's score into components */
export const getScoreBreakdown = (player: Player, allPlayers: Player[]) => {
  const tokenScore = player.tokens.reduce((sum, t) => sum + t.value, 0);
  const bonusScore = player.bonusTokens.reduce((sum, t) => sum + t.value, 0);

  let shipBonus = 0;
  if (allPlayers.length > 1) {
    const maxShips = Math.max(...allPlayers.map((p) => p.ships.length));
    if (player.ships.length > 0 && player.ships.length === maxShips) {
      const playersWithMax = allPlayers.filter((p) => p.ships.length === maxShips).length;
      if (playersWithMax === 1) shipBonus = 5;
    }
  }

  return { tokenScore, bonusScore, shipBonus, total: tokenScore + bonusScore + shipBonus };
};
