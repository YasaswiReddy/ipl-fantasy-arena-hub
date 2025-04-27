import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Star, Trophy, TrendingUp } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import TopPerformerCard from "@/components/TopPerformerCard";
import { api } from "@/services/api";
import Header from "@/components/Header";
import { LeaderboardEntry, Match, TopPerformer } from "@/types";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const Home = () => {
  const navigate = useNavigate();
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [topBatsmen, setTopBatsmen] = useState<TopPerformer[]>([]);
  const [topBowlers, setTopBowlers] = useState<TopPerformer[]>([]);
  const [topTeams, setTopTeams] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load today's matches
        await loadTodayMatches();
        
        // Load top performers
        await Promise.all([
          loadTopBatsmen(),
          loadTopBowlers(),
          loadTopTeams()
        ]);
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const loadTodayMatches = async () => {
    try {
      // In a real implementation, we would filter by today's date
      // For now, using the upcoming matches as a placeholder
      const matches = await api.getMatches('upcoming', 3);
      setTodayMatches(matches);
    } catch (error) {
      console.error("Failed to load today's matches:", error);
    }
  };
  
  const loadTopBatsmen = async () => {
    try {
      // This would ideally be fetched from the API
      // For now, creating sample data based on available types
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // In a production app, you would call the API endpoint
      // const batsmen = await api.getTopPerformers('runs');
      
      // Sample data for demonstration
      const sampleBatsmen: TopPerformer[] = [
        {
          playerId: 1,
          playerName: "Virat Kohli",
          iplTeam: "Royal Challengers Bangalore",
          iplTeamLogo: "/placeholder.svg",
          photoUrl: "/placeholder.svg",
          value: 82,
          metric: "runs"
        },
        {
          playerId: 2,
          playerName: "Jos Buttler",
          iplTeam: "Rajasthan Royals",
          iplTeamLogo: "/placeholder.svg",
          photoUrl: "/placeholder.svg",
          value: 76,
          metric: "runs"
        },
        {
          playerId: 3,
          playerName: "KL Rahul",
          iplTeam: "Punjab Kings",
          iplTeamLogo: "/placeholder.svg",
          photoUrl: "/placeholder.svg",
          value: 68,
          metric: "runs"
        }
      ];
      
      setTopBatsmen(sampleBatsmen);
    } catch (error) {
      console.error("Failed to load top batsmen:", error);
    }
  };
  
  const loadTopBowlers = async () => {
    try {
      // Similar to batsmen, this would be from the API in a real implementation
      const sampleBowlers: TopPerformer[] = [
        {
          playerId: 4,
          playerName: "Jasprit Bumrah",
          iplTeam: "Mumbai Indians",
          iplTeamLogo: "/placeholder.svg",
          photoUrl: "/placeholder.svg",
          value: 4,
          metric: "wickets"
        },
        {
          playerId: 5,
          playerName: "Rashid Khan",
          iplTeam: "Gujarat Titans",
          iplTeamLogo: "/placeholder.svg",
          photoUrl: "/placeholder.svg",
          value: 3,
          metric: "wickets"
        },
        {
          playerId: 6,
          playerName: "Yuzvendra Chahal",
          iplTeam: "Rajasthan Royals",
          iplTeamLogo: "/placeholder.svg",
          photoUrl: "/placeholder.svg",
          value: 3,
          metric: "wickets"
        }
      ];
      
      setTopBowlers(sampleBowlers);
    } catch (error) {
      console.error("Failed to load top bowlers:", error);
    }
  };
  
  const loadTopTeams = async () => {
    try {
      // Fetch top teams from the database
      const { data: teams, error } = await supabase
        .from("fantasy_teams")
        .select(`
          id,
          name,
          total_points
        `)
        .order('total_points', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      // Transform the data to match our LeaderboardEntry type
      const leaderboardEntries: LeaderboardEntry[] = teams.map((team, index) => ({
        rank: index + 1,
        teamId: team.id,
        teamName: team.name,
        ownerName: "User", // This would be fetched in a real implementation
        totalPoints: team.total_points || 0,
        weeklyPoints: 0, // This would be calculated in a real implementation
      }));
      
      setTopTeams(leaderboardEntries);
    } catch (error) {
      console.error("Failed to load top teams:", error);
      
      // Fallback to sample data if database query fails
      const sampleTeams: LeaderboardEntry[] = [
        { rank: 1, teamId: 1, teamName: "Super Kings", ownerName: "User1", totalPoints: 1200, weeklyPoints: 250 },
        { rank: 2, teamId: 2, teamName: "Royal XI", ownerName: "User2", totalPoints: 1150, weeklyPoints: 220 },
        { rank: 3, teamId: 3, teamName: "Cricket Warriors", ownerName: "User3", totalPoints: 1100, weeklyPoints: 210 },
        { rank: 4, teamId: 4, teamName: "Fantasy Titans", ownerName: "User4", totalPoints: 1050, weeklyPoints: 200 },
        { rank: 5, teamId: 5, teamName: "Dream Team", ownerName: "User5", totalPoints: 1000, weeklyPoints: 190 }
      ];
      
      setTopTeams(sampleTeams);
    }
  };
  
  const handleViewLeaderboard = () => {
    navigate('/league/1/leaderboard');
  };
  
  const handleViewPlayer = (playerId: number) => {
    navigate(`/player/${playerId}`);
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-ipl-gradient">
            IPL Fantasy Hub
          </h1>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>
        
        {/* Today's Matches Section */}
        <section className="mb-10">
          <div className="flex items-center mb-4">
            <Calendar className="mr-2 h-5 w-5 text-ipl-blue" />
            <h2 className="text-xl font-semibold">Today's Matches</h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg h-64"></div>
              ))}
            </div>
          ) : todayMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {todayMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-center text-muted-foreground">No matches scheduled for today</p>
              </CardContent>
            </Card>
          )}
        </section>
        
        {/* Top Performers Section */}
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Batsmen */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Star className="mr-2 h-5 w-5 text-ipl-orange" />
                <CardTitle>Top Batsmen</CardTitle>
              </div>
              <CardDescription>Highest run scorers from yesterday's matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-muted h-20 rounded-md"></div>
                  ))}
                </div>
              ) : (
                topBatsmen.map(batsman => (
                  <div 
                    key={batsman.playerId} 
                    className="cursor-pointer"
                    onClick={() => handleViewPlayer(batsman.playerId)}
                  >
                    <TopPerformerCard performer={batsman} title="" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          
          {/* Top Bowlers */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Star className="mr-2 h-5 w-5 text-ipl-blue" />
                <CardTitle>Top Bowlers</CardTitle>
              </div>
              <CardDescription>Highest wicket takers from yesterday's matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-muted h-20 rounded-md"></div>
                  ))}
                </div>
              ) : (
                topBowlers.map(bowler => (
                  <div 
                    key={bowler.playerId} 
                    className="cursor-pointer"
                    onClick={() => handleViewPlayer(bowler.playerId)}
                  >
                    <TopPerformerCard performer={bowler} title="" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
        
        {/* Leaderboard Preview Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-ipl-purple" />
              <h2 className="text-xl font-semibold">Fantasy Leaderboard</h2>
            </div>
            
            <Button 
              variant="ghost" 
              className="text-ipl-purple"
              onClick={handleViewLeaderboard}
            >
              View Full Leaderboard
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="animate-pulse p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center">
                      <div className="w-8 h-8 bg-muted rounded-full mr-4"></div>
                      <div className="flex-1 h-6 bg-muted rounded"></div>
                      <div className="w-16 h-6 bg-muted rounded ml-4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-16">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTeams.map((team) => (
                      <tr 
                        key={team.teamId} 
                        className="border-b border-muted/70 hover:bg-muted/20 cursor-pointer"
                        onClick={() => navigate(`/team/${team.teamId}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/30 font-semibold">
                            {team.rank}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{team.teamName}</div>
                          <div className="text-xs text-muted-foreground">{team.ownerName}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{team.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
            <CardFooter className="bg-muted/10 border-t py-3 px-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span>Updated daily based on match performances</span>
              </div>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Home;