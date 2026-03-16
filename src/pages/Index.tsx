/**
 * Index Page — Main Entry Point
 *
 * Conditionally renders either the LandingPage (lobby/setup) or the
 * GameBoard (active gameplay). The GameBoard is lazy-loaded to keep
 * the initial bundle small — a themed loading screen with anchor icon
 * is shown during the lazy load.
 */

import { lazy, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import { LandingPage } from '@/components/game/LandingPage';
import { Anchor } from 'lucide-react';

// Lazy-load the GameBoard since it's a large component tree
const GameBoard = lazy(() => import('@/components/game/GameBoard').then(m => ({ default: m.GameBoard })));

/** Loading screen shown while the GameBoard chunk is being fetched. */
const GameLoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
    <Anchor className="w-12 h-12 text-primary animate-pulse" />
    <p className="font-pirate text-xl text-primary animate-pulse">Charting the course…</p>
  </div>
);

const Index = () => {
  const { phase } = useGameStore();

  // Show landing page during lobby; show game board for all other phases
  if (phase === 'lobby') {
    return <LandingPage />;
  }

  return (
    <Suspense fallback={<GameLoadingScreen />}>
      <GameBoard />
    </Suspense>
  );
};

export default Index;
