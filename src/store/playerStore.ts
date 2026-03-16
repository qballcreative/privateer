/**
 * Player Store — Persistent Player Profile & Stats
 *
 * Zustand store with localStorage persistence for the player's identity,
 * gameplay statistics, and recent match history. Survives page refreshes.
 *
 * Persisted under the key 'plunder-player'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Difficulty } from '@/types/game';

/** A single completed game record for the recent voyages history. */
export interface VoyageRecord {
  /** ISO 8601 timestamp of when the game ended. */
  date: string;
  /** Whether the local player won this game. */
  won: boolean;
  /** AI difficulty level the game was played at. */
  difficulty: Difficulty;
  /** Local player's final score. */
  playerScore: number;
  /** Opponent's final score. */
  opponentScore: number;
}

/** Aggregate win/loss statistics. */
interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
}

interface PlayerState {
  // ─── Preferences ────────────────────────────────────────────────
  /** The player's display name (shown in game and scoreboard). */
  playerName: string;
  /** Last difficulty the player selected (restored on next visit). */
  lastDifficulty: Difficulty;
  
  // ─── Stats ──────────────────────────────────────────────────────
  /** Aggregate win/loss statistics across all games. */
  stats: PlayerStats;
  /** Rolling history of the last 5 completed games. */
  recentVoyages: VoyageRecord[];
  
  // ─── Actions ────────────────────────────────────────────────────
  setPlayerName: (name: string) => void;
  setLastDifficulty: (difficulty: Difficulty) => void;
  /** Record a game result and optionally add a voyage record to history. */
  recordGameResult: (won: boolean, voyage?: Omit<VoyageRecord, 'won'>) => void;
  /** Reset stats and voyage history (keeps player name). */
  resetStats: () => void;
  /** Full reset — clears name, stats, and difficulty preference. */
  resetAll: () => void;
}

const defaultStats: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      playerName: '',
      lastDifficulty: 'easy',
      stats: defaultStats,
      recentVoyages: [],

      setPlayerName: (name) => set({ playerName: name }),
      
      setLastDifficulty: (difficulty) => set({ lastDifficulty: difficulty }),
      
      recordGameResult: (won, voyage) => set((state) => {
        // Prepend new voyage to history, keeping only the 5 most recent
        const newVoyages = voyage
          ? [{ ...voyage, won }, ...state.recentVoyages].slice(0, 5)
          : state.recentVoyages;
        return {
          stats: {
            gamesPlayed: state.stats.gamesPlayed + 1,
            wins: state.stats.wins + (won ? 1 : 0),
            losses: state.stats.losses + (won ? 0 : 1),
          },
          recentVoyages: newVoyages,
        };
      }),
      
      resetStats: () => set({ stats: defaultStats, recentVoyages: [] }),
      
      resetAll: () => set({
        playerName: '',
        lastDifficulty: 'easy',
        stats: defaultStats,
        recentVoyages: [],
      }),
    }),
    {
      name: 'plunder-player',
    }
  )
);
