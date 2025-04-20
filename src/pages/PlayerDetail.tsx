
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PlayerDetail } from "@/types";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const PlayerDetailPage = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const playerIdNum = playerId ? parseInt(playerId) : null;

  const { data: player, isLoading } = useQuery<PlayerDetail>({
    queryKey: ["player", playerIdNum],
    queryFn: async () => {
      if (!playerIdNum) throw new Error("Player ID is required");
      
      // Combine player details with performance data
      const playerPerformances = await api.getPlayerPerformances(playerIdNum);
      
      // Mock player data that would normally come from the API
      const playerData = {
        id: playerIdNum,
        name: "Player Name",
        role: "Batsman" as const,
        iplTeam: "Team Name",
        iplTeamLogo: "/placeholder.svg",
        photoUrl: "/placeholder.svg",
        seasonPoints: playerPerformances.reduce((sum, perf) => sum + perf.points, 0),
        performances: playerPerformances,
      };
      
      return playerData;
    },
    enabled: !!playerIdNum,
  });

  const handleBack = () => {
    navigate(-1);
  };

  // Create data for chart
  const chartData = player?.performances.map(perf => ({
    date: format(new Date(perf.date), 'dd MMM'),
    points: perf.points,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center">Loading player details...</div>
        ) : player ? (
          <>
            {/* Player Hero Section */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-ipl-gradient text-white p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20">
                    <img 
                      src={player.photoUrl || "/placeholder.svg"} 
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold">{player.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                      <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {player.role}
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-1 bg-white rounded-full p-0.5">
                          <img 
                            src={player.iplTeamLogo || "/placeholder.svg"} 
                            alt={player.iplTeam} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-sm">{player.iplTeam}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 p-4 rounded-lg text-center min-w-28">
                    <div className="text-3xl font-bold">{player.seasonPoints}</div>
                    <div className="text-xs mt-1 opacity-80">SEASON POINTS</div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Points Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="points" 
                        stroke="#004c93" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold">
                        {player.performances.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Matches</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(player.seasonPoints / player.performances.length)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Points</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold">
                        {Math.max(...player.performances.map(p => p.points))}
                      </div>
                      <div className="text-sm text-muted-foreground">Highest</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold">
                        {Math.min(...player.performances.map(p => p.points))}
                      </div>
                      <div className="text-sm text-muted-foreground">Lowest</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Match-wise Fantasy Points */}
            <Card>
              <CardHeader>
                <CardTitle>Match-wise Fantasy Points</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {player.performances.map((perf, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(perf.date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>{perf.opponent}</TableCell>
                        <TableCell className="text-right font-medium">
                          {perf.points}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="py-12 text-center">Player not found</div>
        )}
      </main>
    </div>
  );
};

export default PlayerDetailPage;
