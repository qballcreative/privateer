import { lazy, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import { LandingPage } from '@/components/game/LandingPage';
import { Anchor } from 'lucide-react';

const GameBoard = lazy(() => import('@/components/game/GameBoard').then(m => ({ default: m.GameBoard })));

const GameLoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
    <Anchor className="w-12 h-12 text-primary animate-pulse" />
    <p className="font-pirate text-xl text-primary animate-pulse">Charting the course…</p>
  </div>
);

const Index = () => {
  const { phase } = useGameStore();

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
