
import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

interface TeamWithPlayers {
  id: number;
  name: string;
  captainId: number | null;
  viceCaptainId: number | null;
  players: { id: number; name: string }[];
}

interface EntryWithScore {
  rank: number;
  teamId: number;
  teamName: string;
  totalPoints: number;
}

const LeagueLeaderboard = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const leagueIdNum = leagueId ? parseInt(leagueId) : null;

  // Fetch league info to display the league name
  const { data: leagueInfo, isLoading: leagueLoading } = useQuery({
    queryKey: ["league", leagueIdNum],
    queryFn: async () => {
      if (!leagueIdNum) throw new Error("League ID is required");
      
      const { data, error } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", leagueIdNum)
        .single();
      
      if (error) {
        console.error("Error fetching league info:", error);
        toast.error("Failed to fetch league information");
        throw error;
      }
      
      return data;
    },
    enabled: !!leagueIdNum,
  });

  // Fetch fantasy teams for the league (with players, captain, vice)
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useQuery<TeamWithPlayers[]>({
    queryKey: ["leagueTeams", leagueIdNum],
    queryFn: async () => {
      if (!leagueIdNum) return [];
      
      // Get fantasy teams for the league, including captain, vice_captain, and players
      const { data, error } = await supabase
        .from("fantasy_teams")
        .select(`
          id,
          name,
          captain_id,
          vice_captain_id,
          fantasy_team_players (
            player_id
          )
        `)
        .eq("league_id", leagueIdNum);

      if (error) {
        console.error("Error fetching teams:", error);
        toast.error("Failed to fetch teams in this league");
        return [];
      }

      return data.map((team: any) => ({
        id: team.id,
        name: team.name,
        captainId: team.captain_id,
        viceCaptainId: team.vice_captain_id,
        players: (team.fantasy_team_players || []).map((p: any) => ({
          id: p.player_id,
          name: ""  // Player name not fetched here, for points calculation below it's not required
        })),
      }));
    },
    enabled: !!leagueIdNum,
    retry: 1,
  });

  // Fetch all fantasy scores for these teams' player_ids
  const allPlayerIds = useMemo(
    () =>
      teams
        .flatMap((t) => t.players?.map((p) => p.id) || [])
        .filter(Boolean),
    [teams]
  );
  
  const { data: scores = [], isLoading: scoresLoading, error: scoresError } = useQuery<any[]>({
    queryKey: ["fantasyScores", allPlayerIds],
    queryFn: async () => {
      if (!allPlayerIds.length) return [];
      
      const { data, error } = await supabase
        .from("fantasy_scores")
        .select(`player_id, total_points`)
        .in("player_id", allPlayerIds);
        
      if (error) {
        console.error("Error fetching fantasy scores:", error);
        toast.error("Failed to fetch player scores");
        return [];
      }
      
      return data;
    },
    enabled: !!allPlayerIds.length && allPlayerIds.length > 0,
    retry: 1,
  });

  // Calculate team scores (adding 2x for captain, 1.5x for vice captain)
  const leaderboard: EntryWithScore[] = useMemo(() => {
    if (!teams.length) return [];

    const playerPointsMap: { [key: number]: number } = {};
    for (const row of scores) {
      playerPointsMap[row.player_id] = row.total_points || 0;
    }

    return teams
      .map((team) => {
        let total = 0;
        for (const player of team.players) {
          let mult = 1;
          if (player.id === team.captainId) mult = 2;
          else if (player.id === team.viceCaptainId) mult = 1.5;
          total += (playerPointsMap[player.id] ?? 0) * mult;
        }
        return {
          teamId: team.id,
          teamName: team.name,
          totalPoints: Math.round(total),
          rank: 0, // Will update sorting and assign rank below
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  }, [teams, scores]);

  // For group filter (by prefix)
  const groups = useMemo(() => {
    const uniqueGroups = leaderboard.reduce((acc: string[], entry) => {
      const words = entry.teamName.split(' ');
      if (words.length > 0) {
        const groupName = words[0];
        if (!acc.includes(groupName)) {
          acc.push(groupName);
        }
      }
      return acc;
    }, []);
    
    return ['All', ...uniqueGroups].filter(Boolean);
  }, [leaderboard]);

  const [selectedGroup, setSelectedGroup] = React.useState<string>('All');

  const filteredLeaderboard = useMemo(() => {
    if (selectedGroup === 'All') return leaderboard;
    return leaderboard.filter((entry) =>
      entry.teamName.startsWith(selectedGroup)
    );
  }, [leaderboard, selectedGroup]);

  const loading = leagueLoading || teamsLoading || scoresLoading;
  const error = teamsError || scoresError;
  const hasData = !loading && !error && filteredLeaderboard.length > 0;
  const noData = !loading && !error && filteredLeaderboard.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/home">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-primary">
                {leagueInfo?.name ? `${leagueInfo.name} Leaderboard` : "League Leaderboard"}
              </CardTitle>
              {hasData && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Filter by group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="py-8 text-center text-muted-foreground">
                Loading leaderboard data...
              </div>
            )}
            
            {error && (
              <div className="py-8 text-center text-red-500">
                Error loading leaderboard data. Please try again.
              </div>
            )}
            
            {noData && (
              <div className="py-8 text-center text-muted-foreground">
                No teams found in this league.
              </div>
            )}
            
            {hasData && (
              <LeaderboardTable 
                entries={filteredLeaderboard}
                leagueId={leagueIdNum}
                showAvgPoints={false}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LeagueLeaderboard;
