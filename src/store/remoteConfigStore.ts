import { create } from 'zustand';
import { Difficulty } from '@/types/game';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RemoteConfig {
  adsEnabled: boolean;
  interstitialFrequency: string;
  rewardedEnabled: boolean;
  defaultAIDifficulty: Difficulty;
  enabledRules: string[];
  maxPlayers: number;
  iceServers: IceServer[];
}

const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const DEFAULTS: RemoteConfig = {
  adsEnabled: true,
  interstitialFrequency: 'round_end:capped=1;cooldown=120s',
  rewardedEnabled: true,
  defaultAIDifficulty: 'easy',
  enabledRules: [],
  maxPlayers: 2,
  iceServers: DEFAULT_ICE_SERVERS,
};

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

interface RemoteConfigState {
  config: RemoteConfig;
  loaded: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  _intervalId: ReturnType<typeof setInterval> | null;
}

/**
 * Parse the interstitialFrequency string.
 * Format: "round_end:capped=1;cooldown=120s"
 * Returns { capped, cooldownMs } with safe defaults.
 */
export function parseInterstitialFrequency(str: string): { capped: number; cooldownMs: number } {
  let capped = 1;
  let cooldownMs = 120_000;

  try {
    const cappedMatch = str.match(/capped=(\d+)/);
    if (cappedMatch) capped = parseInt(cappedMatch[1], 10) || 1;

    const cooldownMatch = str.match(/cooldown=(\d+)s/);
    if (cooldownMatch) cooldownMs = (parseInt(cooldownMatch[1], 10) || 120) * 1000;
  } catch {
    // fall back to defaults
  }

  return { capped, cooldownMs };
}

export const useRemoteConfigStore = create<RemoteConfigState>((set, get) => ({
  config: { ...DEFAULTS },
  loaded: false,
  error: null,
  _intervalId: null,

  fetchConfig: async () => {
    try {
      const res = await fetch('/config/remote.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Merge with defaults — only accept known keys with correct types
      const merged: RemoteConfig = {
        adsEnabled: typeof data.adsEnabled === 'boolean' ? data.adsEnabled : DEFAULTS.adsEnabled,
        interstitialFrequency: typeof data.interstitialFrequency === 'string' ? data.interstitialFrequency : DEFAULTS.interstitialFrequency,
        rewardedEnabled: typeof data.rewardedEnabled === 'boolean' ? data.rewardedEnabled : DEFAULTS.rewardedEnabled,
        defaultAIDifficulty: ['easy', 'medium', 'hard', 'expert'].includes(data.defaultAIDifficulty)
          ? data.defaultAIDifficulty
          : DEFAULTS.defaultAIDifficulty,
        enabledRules: Array.isArray(data.enabledRules) ? data.enabledRules : DEFAULTS.enabledRules,
        maxPlayers: typeof data.maxPlayers === 'number' && data.maxPlayers >= 2 ? data.maxPlayers : DEFAULTS.maxPlayers,
      };

      set({ config: merged, loaded: true, error: null });
    } catch (err) {
      // Silent fallback — keep defaults
      set({ loaded: true, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  startPolling: () => {
    const { _intervalId } = get();
    if (_intervalId) return; // already polling
    const id = setInterval(() => {
      get().fetchConfig();
    }, POLL_INTERVAL_MS);
    set({ _intervalId: id });
  },

  stopPolling: () => {
    const { _intervalId } = get();
    if (_intervalId) {
      clearInterval(_intervalId);
      set({ _intervalId: null });
    }
  },
}));
