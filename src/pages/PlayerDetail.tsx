
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PlayerDetail, PlayerPerformance } from "@/types";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PlayerDetailPage = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const playerIdNum = playerId ? parseInt(playerId) : null;

  const { data: player, isLoading } = useQuery<PlayerDetail>({
    queryKey: ["player", playerIdNum],
    queryFn: async () => {
      if (!playerIdNum) throw new Error("Player ID is required");
      const performances = await api.getPlayerPerformances(playerIdNum);
      
      // Make sure the role is one of the allowed types
      const role = performances[0]?.role || "Batsman";
      const validRoles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"] as const;
      const validRole = validRoles.includes(role as any) 
        ? role as "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper"
        : "Batsman";

      return {
        id: playerIdNum,
        name: performances[0]?.name || "Unknown Player",
        role: validRole,
        iplTeam: performances[0]?.opponent || "Unknown Team",
        iplTeamLogo: "/placeholder.svg",
        photoUrl: "/placeholder.svg",
        seasonPoints: performances.reduce((sum, p) => sum + p.points, 0),
        performances,
      };
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
            <Card className="mb-6">
              <CardHeader className="bg-ipl-gradient text-white">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20">
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div>
                    <CardTitle>{player.name}</CardTitle>
                    <div className="flex items-center mt-2">
                      <div className="w-5 h-5 mr-2">
                        <img 
                          src={player.iplTeamLogo} 
                          alt={player.iplTeam} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="opacity-90">{player.iplTeam}</span>
                    </div>
                  </div>
                  
                  <div className="ml-auto text-center">
                    <div className="text-3xl font-bold">{player.seasonPoints}</div>
                    <div className="text-sm opacity-80">Season Points</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="points" stroke="#0284c7" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {player.performances.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Matches</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(player.seasonPoints / player.performances.length)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Points</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {Math.max(...player.performances.map(p => p.points))}
                      </div>
                      <div className="text-sm text-muted-foreground">Best</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {Math.min(...player.performances.map(p => p.points))}
                      </div>
                      <div className="text-sm text-muted-foreground">Lowest</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Match Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead className="text-right">Batting Pts</TableHead>
                      <TableHead className="text-right">Bowling Pts</TableHead>
                      <TableHead className="text-right">Fielding Pts</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {player.performances.map((perf, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(perf.date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>{perf.opponent}</TableCell>
                        <TableCell className="text-right">
                          {perf.runs ? (
                            <div className="text-xs">
                              {perf.runs} runs
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {perf.wickets ? (
                            <div className="text-xs">
                              {perf.wickets} wkts
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {(perf.catches || perf.stumpings) ? (
                            <div className="text-xs">
                              {perf.catches ? `${perf.catches} ct` : ''} 
                              {perf.stumpings ? `${perf.stumpings} st` : ''}
                            </div>
                          ) : '-'}
                        </TableCell>
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
