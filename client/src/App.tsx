import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { useCalendarSync } from "@/hooks/use-calendar-sync";
import Dashboard from "@/pages/dashboard";
import EmotionsPage from "@/pages/emotions";
import FearFighterPage from "@/pages/fear-fighter";
import BreathingPage from "@/pages/breathing";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/breathing" component={BreathingPage} />
      <Route path="/emotions" component={EmotionsPage} />
      <Route path="/fear-fighter" component={FearFighterPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithSync() {
  // Initialize global calendar sync that runs on app startup
  useCalendarSync({
    enableAutoSync: true,
    syncInterval: 0, // No periodic sync at app level (handled by dashboard)
    showToasts: false // No toasts at app level to avoid duplicates
  });

  return <Router />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="brainbow-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppWithSync />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
