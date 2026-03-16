/**
 * Game Audio Hook — Sound Effects & Background Music
 *
 * Provides playSound() and playMusic() functions that respect the user's
 * audio settings from settingsStore. Sound effects are preloaded on mount
 * for instant playback. Background music loops continuously when enabled.
 *
 * All audio files are loaded from /sounds/ in the public directory.
 * Autoplay restrictions are handled gracefully — failed play() calls
 * are silently caught (the user will hear audio on their next interaction).
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { ActionType } from '@/types/game';

/** All sound types that can be played — game actions plus UI feedback sounds. */
type SoundType = ActionType | 'round-win' | 'round-lose' | 'game-win' | 'game-lose' | 'click' | 'error' | 'message' | 'new-round' | 'thud' | 'creak';

/** Mapping of sound types to their audio file paths. */
const SOUND_URLS: Record<SoundType, string> = {
  'take': '/sounds/card-take.mp3',
  'take-ships': '/sounds/ship-take.mp3',
  'exchange': '/sounds/card-exchange.mp3',
  'sell': '/sounds/coin-collect.mp3',
  'raid': '/sounds/raid.mp3',
  'storm': '/sounds/storm.mp3',
  'round-win': '/sounds/victory.mp3',
  'round-lose': '/sounds/defeat.mp3',
  'game-win': '/sounds/victory-fanfare.mp3',
  'game-lose': '/sounds/defeat.mp3',
  'click': '/sounds/click.mp3',
  'error': '/sounds/error.mp3',
  'message': '/sounds/message.mp3',
  'new-round': '/sounds/new_game.mp3',
  'thud': '/sounds/error.mp3',
  'creak': '/sounds/sea_sounds.wav',
};

/** Path to the looping background music track. */
const MUSIC_URL = '/sounds/background-music.mp3';

export const useGameAudio = () => {
  const { soundEnabled, musicEnabled, soundVolume, musicVolume } = useSettingsStore();
  /** Persistent reference to the background music Audio element. */
  const musicRef = useRef<HTMLAudioElement | null>(null);
  /** Cache of preloaded sound effect Audio elements, keyed by SoundType. */
  const soundsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Initialize and preload all audio elements on first mount
  useEffect(() => {
    // Create the background music element (looping)
    if (!musicRef.current) {
      const music = new Audio(MUSIC_URL);
      music.loop = true;
      music.volume = musicVolume;
      musicRef.current = music;
    }

    // Preload all sound effects so they play instantly when triggered
    Object.entries(SOUND_URLS).forEach(([type, url]) => {
      if (!soundsRef.current.has(type as SoundType)) {
        const audio = new Audio(url);
        audio.volume = soundVolume;
        soundsRef.current.set(type as SoundType, audio);
      }
    });

    // Clean up music on unmount
    return () => {
      musicRef.current?.pause();
      musicRef.current = null;
    };
  }, []);

  // Sync volume changes to all audio elements
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
    }
    soundsRef.current.forEach((audio) => {
      audio.volume = soundVolume;
    });
  }, [soundVolume, musicVolume]);

  // Start or stop background music when the setting changes
  useEffect(() => {
    if (musicRef.current) {
      if (musicEnabled) {
        musicRef.current.play().catch(() => {
          // Autoplay blocked by browser — will play on next user interaction
        });
      } else {
        musicRef.current.pause();
      }
    }
  }, [musicEnabled]);

  /** Play a sound effect by type (respects soundEnabled setting). */
  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;
    
    const audio = soundsRef.current.get(type);
    if (audio) {
      audio.currentTime = 0; // Reset to start so rapid plays work
      audio.play().catch(() => {
        // Sound play failed — silently ignore
      });
    }
  }, [soundEnabled]);

  /** Convenience wrapper to play the sound for a game action type. */
  const playActionSound = useCallback((actionType: ActionType) => {
    playSound(actionType);
  }, [playSound]);

  /** Start background music playback (if enabled in settings). */
  const playMusic = useCallback(() => {
    if (musicRef.current && musicEnabled) {
      musicRef.current.play().catch(() => {});
    }
  }, [musicEnabled]);

  /** Stop and reset background music. */
  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, []);

  return {
    playSound,
    playActionSound,
    playMusic,
    stopMusic,
  };
};
