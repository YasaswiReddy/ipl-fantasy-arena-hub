
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { FantasyTeam } from "@/types";
import Header from "@/components/Header";
import PlayerCard from "@/components/PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const handlePlayerClick = (playerId: number) => {
    navigate(`/player/${playerId}`);
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
            
            <Card>
              <CardHeader>
                <CardTitle>Team Players</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Season Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.players.map((player) => (
                      <TableRow 
                        key={player.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handlePlayerClick(player.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                              <img 
                                src={player.photoUrl || "/placeholder.svg"} 
                                alt={player.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              {player.id === team.captainId && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">C</span>
                              )}
                              {player.id === team.viceCaptainId && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">VC</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{player.role}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4">
                              <img 
                                src={player.iplTeamLogo || "/placeholder.svg"} 
                                alt={player.iplTeam} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {player.iplTeam}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {player.seasonPoints}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="py-12 text-center">Team not found</div>
        )}
      </main>
    </div>
  );
};

export default TeamDetail;
