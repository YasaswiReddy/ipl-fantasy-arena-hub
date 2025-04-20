
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { FantasyTeam } from "@/types";
import Header from "@/components/Header";
import PlayerCard from "@/components/PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const TeamDetail = () => {
  const { leagueId, teamId } = useParams<{ leagueId: string; teamId: string }>();
  const navigate = useNavigate();
  const leagueIdNum = leagueId ? parseInt(leagueId) : null;
  const teamIdNum = teamId ? parseInt(teamId) : null;

  const { data: team, isLoading } = useQuery<FantasyTeam>({
    queryKey: ["team", teamIdNum],
    queryFn: async () => {
      if (!teamIdNum) throw new Error("Team ID is required");
      const data = await api.getFantasyTeam(teamIdNum);
      return data;
    },
    enabled: !!teamIdNum,
  });

  const handleBackClick = () => {
    if (leagueId) {
      navigate(`/league/${leagueId}/leaderboard`);
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Leaderboard
          </Button>
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center">Loading team details...</div>
        ) : team ? (
          <>
            <Card className="mb-6">
              <CardHeader className="bg-ipl-gradient text-white">
                <CardTitle>{team.name}</CardTitle>
                <p className="text-sm mt-1 opacity-80">Owned by {team.ownerName}</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="bg-muted/30 px-4 py-2 rounded-md">
                    <span className="text-sm text-muted-foreground">Total Points</span>
                    <div className="text-2xl font-bold">{team.totalPoints}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Captain</span>
                    <div className="font-medium">
                      {team.players.find(p => p.id === team.captainId)?.name || 'Unknown'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Vice Captain</span>
                    <div className="font-medium">
                      {team.players.find(p => p.id === team.viceCaptainId)?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <h2 className="text-2xl font-bold mb-4">Fantasy Team Sheet</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {team.players.map((player) => (
                <PlayerCard 
                  key={player.id} 
                  player={player} 
                  isCaptain={player.id === team.captainId}
                  isViceCaptain={player.id === team.viceCaptainId}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center">Team not found</div>
        )}
      </main>
    </div>
  );
};

export default TeamDetail;
