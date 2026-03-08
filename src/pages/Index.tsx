import { lazy, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import { LandingPage } from '@/components/game/LandingPage';

const GameBoard = lazy(() => import('@/components/game/GameBoard').then(m => ({ default: m.GameBoard })));

const Index = () => {
  const { phase } = useGameStore();

  if (phase === 'lobby') {
    return <LandingPage />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading game…</div>}>
      <GameBoard />
    </Suspense>
  );
};

export default Index;