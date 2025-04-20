
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { LeaderboardEntry } from "@/types";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const LeagueLeaderboard = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const leagueIdNum = leagueId ? parseInt(leagueId) : null;

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leagueLeaderboard", leagueIdNum],
    queryFn: async () => {
      if (!leagueIdNum) return [];
      const data = await api.getLeagueLeaderboard(leagueIdNum);
      return data;
    },
    enabled: !!leagueIdNum,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/home">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-6">League Leaderboard</h1>
          
          {isLoading ? (
            <div className="py-8 text-center">Loading leaderboard...</div>
          ) : (
            <LeaderboardTable 
              entries={leaderboard} 
              leagueId={leagueIdNum} 
              showAvgPoints={true} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default LeagueLeaderboard;
