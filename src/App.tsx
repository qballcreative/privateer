/**
 * App — Root Component
 *
 * Sets up the application shell: React Query provider, tooltip context,
 * toast notifications (both Radix and Sonner), and client-side routing.
 *
 * On mount, fetches remote configuration (ad settings, ICE servers, etc.)
 * and begins polling for updates every 30 minutes.
 *
 * Routes:
 *  /           → Index (lobby or game board depending on game phase)
 *  /how-to-play → Static rules reference page
 *  /debug      → Dev-only debug panel (rules log, ad events)
 *  *           → 404 Not Found
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useRemoteConfigStore } from "@/store/remoteConfigStore";
import { useSettingsStore } from "@/store/settingsStore";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-load non-critical pages to reduce initial bundle size
const DebugPanel = lazy(() => import("./pages/DebugPanel"));
const HowToPlay = lazy(() => import("./pages/HowToPlay"));

/** Shared React Query client instance for any future data-fetching needs. */
const queryClient = new QueryClient();

const App = () => {
  // Apply the user's chosen theme (dark or parchment) to the root element
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Fetch remote config on mount and start periodic polling
  useEffect(() => {
    const { fetchConfig, startPolling } = useRemoteConfigStore.getState();
    fetchConfig();
    startPolling();
    return () => useRemoteConfigStore.getState().stopPolling();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Two toast systems: Radix UI toaster + Sonner for different notification styles */}
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
          {/* Debug panel only available in development builds */}
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
