import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OptionalRules } from '@/types/game';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  actionNotificationDuration: number;
  optionalRules: OptionalRules;
  theme: 'dark' | 'parchment';
  hasSeenMusicHint: boolean;
  
  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setActionNotificationDuration: (duration: number) => void;
  setOptionalRule: (key: keyof OptionalRules, value: boolean) => void;
  setOptionalRules: (rules: OptionalRules) => void;
  setTheme: (theme: 'dark' | 'parchment') => void;
  setHasSeenMusicHint: (seen: boolean) => void;
}

const defaultOptionalRules: OptionalRules = {
  stormRule: false,
  pirateRaid: false,
  treasureChest: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: false,
      soundVolume: 0.7,
      musicVolume: 0.3,
      actionNotificationDuration: 3,
      optionalRules: defaultOptionalRules,
      theme: 'dark',
      hasSeenMusicHint: false,

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setActionNotificationDuration: (duration) => set({ actionNotificationDuration: duration }),
      setOptionalRule: (key, value) => set((state) => ({
        optionalRules: { ...state.optionalRules, [key]: value },
      })),
      setOptionalRules: (rules) => set({ optionalRules: rules }),
      setTheme: (theme) => set({ theme }),
      setHasSeenMusicHint: (seen) => set({ hasSeenMusicHint: seen }),
    }),
    {
      name: 'plunder-settings',
    }
  )
);
