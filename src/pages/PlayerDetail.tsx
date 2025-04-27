import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PlayerDetail, PlayerPerformance } from "@/types";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Info, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Medal } from "lucide-react";
import { format } from "date-fns";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ComposedChart
} from "recharts";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Enhanced Player Detail Page
 * 
 * This page shows comprehensive information about a player including:
 * - Basic player information (name, team, role)
 * - Player ranking among all players
 * - Performance metrics (avg points, consistency, recent form)
 * - Interactive performance charts with multiple views
 * - Detailed match history
 */
const PlayerDetailPage = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const playerIdNum = playerId ? parseInt(playerId) : null;

  // Fetch player data and performances
  const { data: player, isLoading } = useQuery<PlayerDetail>({
    queryKey: ["player", playerIdNum],
    queryFn: async () => {
      if (!playerIdNum) throw new Error("Player ID is required");
      // Use the enhanced API method to get complete player details
      return api.getPlayerDetail(playerIdNum);
    },
    enabled: !!playerIdNum,
  });

  // Fetch player ranking
  const { data: ranking } = useQuery({
    queryKey: ["player-ranking", playerIdNum],
    queryFn: async () => {
      if (!playerIdNum) throw new Error("Player ID is required");
      return api.getPlayerRanking(playerIdNum);
    },
    enabled: !!playerIdNum,
  });

  // Calculate additional stats
  const playerStats = useMemo(() => {
    if (!player?.performances?.length) return null;
    
    const performances = player.performances;
    const totalMatches = performances.length;
    const totalPoints = performances.reduce((sum, p) => sum + p.points, 0);
    const avgPoints = totalMatches > 0 ? totalPoints / totalMatches : 0;
    
    // Calculate consistency (standard deviation)
    const variance = performances.reduce((sum, p) => sum + Math.pow(p.points - avgPoints, 2), 0) / totalMatches;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avgPoints * 100)); // Higher value = more consistent
    
    // Recent form (average of last 3 matches)
    const recentMatches = performances.slice(0, 3);
    const recentForm = recentMatches.reduce((sum, p) => sum + p.points, 0) / recentMatches.length;
    
    // Batting stats
    const battingPerformances = performances.filter(p => p.runs && p.runs > 0);
    const totalRuns = battingPerformances.reduce((sum, p) => sum + (p.runs || 0), 0);
    const battingAvg = battingPerformances.length > 0 ? totalRuns / battingPerformances.length : 0;
    
    // Bowling stats
    const bowlingPerformances = performances.filter(p => p.wickets && p.wickets > 0);
    const totalWickets = bowlingPerformances.reduce((sum, p) => sum + (p.wickets || 0), 0);
    const bowlingAvg = bowlingPerformances.length > 0 ? totalWickets / bowlingPerformances.length : 0;
    
    // Trend (comparing recent form with overall average)
    const trend = recentForm > avgPoints ? "improving" : recentForm < avgPoints ? "declining" : "stable";
    
    return {
      totalMatches,
      avgPoints: Math.round(avgPoints * 10) / 10,
      consistency: Math.round(consistency),
      recentForm: Math.round(recentForm * 10) / 10,
      battingAvg: Math.round(battingAvg * 10) / 10,
      totalRuns,
      bowlingAvg: Math.round(bowlingAvg * 10) / 10,
      totalWickets,
      trend,
      pointsPerMatch: performances.map(p => p.points),
      bestMatch: Math.max(...performances.map(p => p.points)),
      worstMatch: Math.min(...performances.map(p => p.points)),
    };
  }, [player]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!player?.performances?.length) return [];
    
    return player.performances
      .slice() // Create a copy to avoid mutating the original array
      .reverse() // Reverse to show chronological order
      .map(perf => {
        // Calculate components of points (simplified)
        const battingPoints = perf.runs || 0;
        const bowlingPoints = (perf.wickets || 0) * 25; // Simplified calculation
        const fieldingPoints = perf.points - battingPoints - bowlingPoints;
        
        return {
          date: format(new Date(perf.date), 'dd MMM'),
          fullDate: perf.date,
          opponent: perf.opponent,
          points: perf.points,
          battingPoints,
          bowlingPoints,
          fieldingPoints,
          runsMade: perf.runs || 0,
          wicketsTaken: perf.wickets || 0,
          catches: perf.catches || 0,
          stumpings: perf.stumpings || 0,
        };
      });
  }, [player]);

  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-background p-3 rounded-md border shadow-md">
        <p className="font-medium">{label} vs {data.opponent}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(data.fullDate), 'dd MMM yyyy')}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-sm">Points:</span>
          <span className="text-sm font-medium">{data.points}</span>
          
          {data.runsMade > 0 && (
            <>
              <span className="text-sm">Runs:</span>
              <span className="text-sm font-medium">{data.runsMade}</span>
            </>
          )}
          
          {data.wicketsTaken > 0 && (
            <>
              <span className="text-sm">Wickets:</span>
              <span className="text-sm font-medium">{data.wicketsTaken}</span>
            </>
          )}
          
          {(data.catches > 0 || data.stumpings > 0) && (
            <>
              <span className="text-sm">Catches/St:</span>
              <span className="text-sm font-medium">
                {data.catches > 0 ? `${data.catches} ct` : ''} 
                {data.stumpings > 0 ? `${data.stumpings} st` : ''}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

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
            {/* Player Header Card */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-ipl-gradient text-white">
                <CardHeader className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  <div className="flex items-center col-span-2">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                      <img 
                        src={player.photoUrl} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="ml-6">
                      <div className="flex items-center">
                        <CardTitle className="text-2xl">{player.name}</CardTitle>
                        {ranking && (
                          <div className="ml-3 flex items-center">
                            <Badge className="bg-yellow-500 text-white flex items-center">
                              <Medal className="h-3 w-3 mr-1" />
                              Rank #{ranking.rank}
                            </Badge>
                            <span className="ml-2 text-xs opacity-90">
                              (Top {100 - ranking.percentile}%)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center mt-2">
                        <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                          {player.role}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-3">
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
                  </div>
                  
                  <div className="flex justify-center md:justify-end items-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{player.seasonPoints}</div>
                      <div className="text-sm opacity-80">Season Points</div>
                      {playerStats && (
                        <div className="mt-1 flex items-center justify-center">
                          <Badge className={cn(
                            "text-xs", 
                            playerStats.trend === "improving" ? "bg-green-500" : 
                            playerStats.trend === "declining" ? "bg-red-500" : 
                            "bg-blue-500"
                          )}>
                            {playerStats.trend === "improving" ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : playerStats.trend === "declining" ? (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            ) : null}
                            {playerStats.trend === "improving" ? "Improving" : 
                             playerStats.trend === "declining" ? "Declining" : "Stable"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </div>
            </Card>
            
            {/* Stats Cards Grid */}
            {playerStats && (
              <div className="grid gap-6 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>Average Points</span>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Average fantasy points per match</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold">{playerStats.avgPoints}</div>
                      <div className="text-xs text-muted-foreground">From {playerStats.totalMatches} matches</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>Recent Form</span>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Average points from last 3 matches</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-end">
                        <span className="text-3xl font-bold">{playerStats.recentForm}</span>
                        <span className={cn("ml-2 flex items-center text-sm", 
                          playerStats.recentForm > playerStats.avgPoints ? "text-green-500" : 
                          playerStats.recentForm < playerStats.avgPoints ? "text-red-500" : 
                          "text-blue-500"
                        )}>
                          {playerStats.recentForm > playerStats.avgPoints ? (
                            <><ChevronUp className="h-4 w-4" /> {Math.round((playerStats.recentForm - playerStats.avgPoints) * 10) / 10}</>
                          ) : playerStats.recentForm < playerStats.avgPoints ? (
                            <><ChevronDown className="h-4 w-4" /> {Math.round((playerStats.avgPoints - playerStats.recentForm) * 10) / 10}</>
                          ) : "→"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">Last 3 matches</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>Consistency</span>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Higher value means more consistent performance</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-end">
                        <span className="text-3xl font-bold">{playerStats.consistency}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Range: {playerStats.worstMatch} - {playerStats.bestMatch} pts
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {player.role === "Bowler" ? "Bowling Average" : 
                       player.role === "Batsman" || player.role === "Wicket-Keeper" ? "Batting Average" : 
                       "All-Round Stats"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {player.role === "Bowler" ? (
                        <>
                          <div className="text-3xl font-bold">{playerStats.bowlingAvg}</div>
                          <div className="text-xs text-muted-foreground">
                            Total: {playerStats.totalWickets} wickets
                          </div>
                        </>
                      ) : player.role === "Batsman" || player.role === "Wicket-Keeper" ? (
                        <>
                          <div className="text-3xl font-bold">{playerStats.battingAvg}</div>
                          <div className="text-xs text-muted-foreground">
                            Total: {playerStats.totalRuns} runs
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-lg font-bold">{playerStats.battingAvg}</div>
                              <div className="text-xs text-muted-foreground">Batting Avg</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold">{playerStats.bowlingAvg}</div>
                              <div className="text-xs text-muted-foreground">Bowling Avg</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Chart Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>
                  Fantasy points breakdown across matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="points">
                  <TabsList className="mb-4">
                    <TabsTrigger value="points">Points Trend</TabsTrigger>
                    <TabsTrigger value="breakdown">Points Breakdown</TabsTrigger>
                    <TabsTrigger value="stats">Match Stats</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="points" className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="points" 
                          stroke="#0284c7" 
                          strokeWidth={3}
                          dot={{ r: 5 }} 
                          activeDot={{ r: 7 }}
                        />
                        {playerStats && (
                          <CartesianGrid 
                            horizontal={false} 
                            vertical={false} 
                            y={playerStats.avgPoints}
                            stroke="#888" 
                            strokeDasharray="3 3" 
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="breakdown" className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="battingPoints" name="Batting" stackId="a" fill="#f97316" />
                        <Bar dataKey="bowlingPoints" name="Bowling" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="fieldingPoints" name="Fielding" stackId="a" fill="#10b981" />
                        <Line 
                          type="monotone" 
                          dataKey="points" 
                          name="Total Points"
                          stroke="#000" 
                          strokeWidth={2}
                          dot={{ r: 4 }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="stats" className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {playerStats && playerStats.totalRuns > 0 && (
                          <Bar 
                            yAxisId="left"
                            dataKey="runsMade" 
                            name="Runs" 
                            fill="#f97316" 
                            radius={[4, 4, 0, 0]}
                          />
                        )}
                        {playerStats && playerStats.totalWickets > 0 && (
                          <Bar 
                            yAxisId="right"
                            dataKey="wicketsTaken" 
                            name="Wickets" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]}
                          />
                        )}
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="points" 
                          name="Points"
                          stroke="#000" 
                          strokeWidth={2}
                          dot={{ r: 4 }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Match Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Match Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Opponent</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Wickets</TableHead>
                        <TableHead className="text-right">Field</TableHead>
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
                            <div className="flex items-center justify-end">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                perf.points > (playerStats?.avgPoints || 0) ? "bg-green-100 text-green-800" :
                                perf.points < (playerStats?.avgPoints || 0) ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              )}>
                                {perf.points}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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