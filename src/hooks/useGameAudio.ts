import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { ActionType } from '@/types/game';

type SoundType = ActionType | 'round-win' | 'round-lose' | 'game-win' | 'game-lose' | 'click' | 'error' | 'message' | 'new-round' | 'thud' | 'creak';

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
  'game-lose': '/sounds/defeat-horn.mp3',
  'click': '/sounds/click.mp3',
  'error': '/sounds/error.mp3',
  'message': '/sounds/message.mp3',
  'new-round': '/sounds/new_game.mp3',
  'thud': '/sounds/error.mp3',
  'creak': '/sounds/sea_sounds.wav',
};

const MUSIC_URL = '/sounds/background-music.mp3';

export const useGameAudio = () => {
  const { soundEnabled, musicEnabled, soundVolume, musicVolume } = useSettingsStore();
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const soundsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Initialize audio elements
  useEffect(() => {
    // Create music element
    if (!musicRef.current) {
      const music = new Audio(MUSIC_URL);
      music.loop = true;
      music.volume = musicVolume;
      musicRef.current = music;
    }

    // Preload sound effects
    Object.entries(SOUND_URLS).forEach(([type, url]) => {
      if (!soundsRef.current.has(type as SoundType)) {
        const audio = new Audio(url);
        audio.volume = soundVolume;
        soundsRef.current.set(type as SoundType, audio);
      }
    });

    return () => {
      musicRef.current?.pause();
      musicRef.current = null;
    };
  }, []);

  // Update volumes
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
    }
    soundsRef.current.forEach((audio) => {
      audio.volume = soundVolume;
    });
  }, [soundVolume, musicVolume]);

  // Handle music enable/disable
  useEffect(() => {
    if (musicRef.current) {
      if (musicEnabled) {
        musicRef.current.play().catch(() => {
          // Autoplay blocked - user interaction required
        });
      } else {
        musicRef.current.pause();
      }
    }
  }, [musicEnabled]);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;
    
    const audio = soundsRef.current.get(type);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Sound play failed
      });
    }
  }, [soundEnabled]);

  const playActionSound = useCallback((actionType: ActionType) => {
    playSound(actionType);
  }, [playSound]);

  const playMusic = useCallback(() => {
    if (musicRef.current && musicEnabled) {
      musicRef.current.play().catch(() => {});
    }
  }, [musicEnabled]);

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
