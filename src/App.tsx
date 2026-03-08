import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useRemoteConfigStore } from "@/store/remoteConfigStore";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const DebugPanel = lazy(() => import("./pages/DebugPanel"));
const HowToPlay = lazy(() => import("./pages/HowToPlay"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const { fetchConfig, startPolling } = useRemoteConfigStore.getState();
    fetchConfig();
    startPolling();
    return () => useRemoteConfigStore.getState().stopPolling();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/how-to-play"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading…</div>}>
                <HowToPlay />
              </Suspense>
            }
          />
          {import.meta.env.DEV && (
            <Route
              path="/debug"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading debug panel…</div>}>
                  <DebugPanel />
                </Suspense>
              }
            />
          )}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
