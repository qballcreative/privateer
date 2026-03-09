import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Difficulty } from '@/types/game';

export interface VoyageRecord {
  date: string; // ISO
  won: boolean;
  difficulty: Difficulty;
  playerScore: number;
  opponentScore: number;
}

interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
}

interface PlayerState {
  // Preferences
  playerName: string;
  lastDifficulty: Difficulty;
  
  // Stats
  stats: PlayerStats;

  // Voyage history (last 5)
  recentVoyages: VoyageRecord[];
  
  // Actions
  setPlayerName: (name: string) => void;
  setLastDifficulty: (difficulty: Difficulty) => void;
  recordGameResult: (won: boolean, voyage?: Omit<VoyageRecord, 'won'>) => void;
  resetStats: () => void;
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
      lastDifficulty: 'medium',
      stats: defaultStats,
      recentVoyages: [],

      setPlayerName: (name) => set({ playerName: name }),
      
      setLastDifficulty: (difficulty) => set({ lastDifficulty: difficulty }),
      
      recordGameResult: (won, voyage) => set((state) => {
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
        lastDifficulty: 'medium',
        stats: defaultStats,
        recentVoyages: [],
      }),
    }),
    {
      name: 'plunder-player',
    }
  )
);
