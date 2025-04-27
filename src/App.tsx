import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LeagueProvider } from "@/contexts/LeagueContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import LeagueLeaderboard from "./pages/LeagueLeaderboard";
import TeamDetail from "./pages/TeamDetail";
import PlayerDetail from "./pages/PlayerDetail";
import NotFoundRedirect from "./pages/NotFoundRedirect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LeagueProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/league/:leagueId/leaderboard" element={<LeagueLeaderboard />} />
              <Route path="/league/:leagueId/team/:teamId" element={<TeamDetail />} />
              <Route path="/team/:teamId" element={<TeamDetail />} />
              <Route path="/player/:playerId" element={<PlayerDetail />} />
              <Route path="*" element={<NotFoundRedirect />} />
            </Routes>
          </LeagueProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;