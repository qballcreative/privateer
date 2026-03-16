/**
 * Remote Config Store — Server-Driven Feature Flags
 *
 * Fetches configuration from /config/remote.json and polls for updates
 * every 30 minutes. Controls ad settings, default difficulty, ICE servers
 * for WebRTC, and other runtime-configurable values.
 *
 * Falls back to sensible defaults if the config file is unavailable.
 * All incoming values are type-checked before being applied.
 */

import { create } from 'zustand';
import { Difficulty } from '@/types/game';

/** ICE/TURN server configuration for WebRTC peer connections. */
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** Shape of the remote configuration object. */
export interface RemoteConfig {
  /** Global kill switch for all ad formats. */
  adsEnabled: boolean;
  /**
   * Interstitial ad frequency string.
   * Format: "round_end:capped=1;cooldown=120s"
   * Parsed by parseInterstitialFrequency().
   */
  interstitialFrequency: string;
  /** Whether rewarded video ads are available. */
  rewardedEnabled: boolean;
  /** Whether video interstitial ads are enabled. */
  videoInterstitialEnabled: boolean;
  /** Default AI difficulty for new players. */
  defaultAIDifficulty: Difficulty;
  /** Optional rules enabled by default (empty = all off). */
  enabledRules: string[];
  /** Maximum players per game (currently always 2). */
  maxPlayers: number;
  /** ICE/TURN servers for WebRTC NAT traversal. */
  iceServers: IceServer[];
}

/** Default ICE servers — free Google STUN + Twilio STUN. */
const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

/** Fallback defaults used when the remote config file is unavailable. */
const DEFAULTS: RemoteConfig = {
  adsEnabled: true,
  interstitialFrequency: 'round_end:capped=1;cooldown=120s',
  rewardedEnabled: true,
  videoInterstitialEnabled: true,
  defaultAIDifficulty: 'easy',
  enabledRules: [],
  maxPlayers: 2,
  iceServers: DEFAULT_ICE_SERVERS,
};

/** How often to re-fetch the remote config (30 minutes). */
const POLL_INTERVAL_MS = 30 * 60 * 1000;

interface RemoteConfigState {
  config: RemoteConfig;
  /** Whether the initial fetch has completed (success or failure). */
  loaded: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  _intervalId: ReturnType<typeof setInterval> | null;
}

/**
 * Parse the interstitialFrequency config string into structured values.
 *
 * @param str - Format: "round_end:capped=1;cooldown=120s"
 * @returns { capped, cooldownMs } with safe fallback defaults.
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
    // Fall back to defaults on parse error
  }

  return { capped, cooldownMs };
}

export const useRemoteConfigStore = create<RemoteConfigState>((set, get) => ({
  config: { ...DEFAULTS },
  loaded: false,
  error: null,
  _intervalId: null,

  /**
   * Fetch remote config from the server. Type-checks each field and
   * merges with defaults so missing/invalid values don't break the app.
   */
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
        videoInterstitialEnabled: typeof data.videoInterstitialEnabled === 'boolean' ? data.videoInterstitialEnabled : DEFAULTS.videoInterstitialEnabled,
        defaultAIDifficulty: ['easy', 'medium', 'hard', 'expert'].includes(data.defaultAIDifficulty)
          ? data.defaultAIDifficulty
          : DEFAULTS.defaultAIDifficulty,
        enabledRules: Array.isArray(data.enabledRules) ? data.enabledRules : DEFAULTS.enabledRules,
        maxPlayers: typeof data.maxPlayers === 'number' && data.maxPlayers >= 2 ? data.maxPlayers : DEFAULTS.maxPlayers,
        iceServers: Array.isArray(data.iceServers) ? data.iceServers : DEFAULTS.iceServers,
      };

      set({ config: merged, loaded: true, error: null });
    } catch (err) {
      // Silent fallback — keep defaults
      set({ loaded: true, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  /** Begin periodic re-fetching of remote config. */
  startPolling: () => {
    const { _intervalId } = get();
    if (_intervalId) return; // Already polling
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
