
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
  leagueId: number | null;
  captainId: number | null;
  viceCaptainId: number | null;
  players: { id: number; name: string }[];
}

interface EntryWithScore {
  rank: number;
  teamId: number;
  teamName: string;
  totalPoints: number;
  leagueId?: number;
}

const LeagueLeaderboard = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const leagueIdNum = leagueId ? parseInt(leagueId) : null;

  // Fetch all leagues for dropdown filter
  const { data: allLeagues = [], isLoading: leagueLoading, error: leagueError } = useQuery({
    queryKey: ["leagues-for-leaderboard"],
    queryFn: async () => {
      console.log("Fetching leagues");
      const { data, error } = await supabase.from("leagues").select("id, name");
      if (error) {
        console.error("Error fetching leagues:", error);
        throw error;
      }
      console.log("Leagues data:", data);
      return data;
    }
  });

  // Fetch ALL fantasy teams (no league filter)
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useQuery<TeamWithPlayers[]>({
    queryKey: ["allFantasyTeams"],
    queryFn: async () => {
      console.log("Fetching all fantasy teams");
      const { data, error } = await supabase
        .from("fantasy_teams")
        .select(`
          id,
          name,
          league_id,
          captain_id,
          vice_captain_id,
          fantasy_team_players (
            player_id
          )
        `);

      if (error) {
        console.error("Error fetching all fantasy teams:", error);
        toast.error("Failed to fetch fantasy teams");
        return [];
      }

      console.log("Fantasy teams data:", data);
      return data.map((team: any) => ({
        id: team.id,
        name: team.name,
        leagueId: team.league_id,
        captainId: team.captain_id,
        viceCaptainId: team.vice_captain_id,
        players: (team.fantasy_team_players || []).map((p: any) => ({
          id: p.player_id,
          name: ""
        })),
      }));
    },
    retry: 1,
  });

  // Fetch all scores for all players found above
  const allPlayerIds = useMemo(
    () =>
      teams
        .flatMap((t) => t.players?.map((p) => p.id) || [])
        .filter(Boolean),
    [teams]
  );

  // Fixed: Requesting all fantasy scores for players and aggregating by player_id
  const { data: scores = [], isLoading: scoresLoading, error: scoresError } = useQuery<any[]>({
    queryKey: ["fantasyScoresLeaderboard", allPlayerIds],
    queryFn: async () => {
      if (!allPlayerIds.length) return [];
      console.log("Fetching scores for players:", allPlayerIds);
      
      // Get scores across ALL fixtures for each player
      const { data, error } = await supabase
        .from("fantasy_scores")
        .select(`player_id, total_points, fixture_id`)
        .in("player_id", allPlayerIds);

      if (error) {
        console.error("Error fetching player scores:", error);
        toast.error("Failed to fetch player scores");
        return [];
      }
      
      console.log("Raw scores data:", data);
      
      // Aggregate scores by player_id
      const aggregatedScores = data.reduce((acc: {[key: number]: number}, score) => {
        const playerId = score.player_id;
        if (!acc[playerId]) {
          acc[playerId] = 0;
        }
        acc[playerId] += (score.total_points || 0);
        return acc;
      }, {});
      
      // Convert to array format for consistency with existing code
      const processedScores = Object.entries(aggregatedScores).map(([playerId, totalPoints]) => ({
        player_id: parseInt(playerId),
        total_points: totalPoints
      }));
      
      console.log("Aggregated scores by player:", processedScores);
      return processedScores;
    },
    enabled: !!allPlayerIds.length && allPlayerIds.length > 0,
    retry: 1,
  });

  // Calculate leaderboard entries
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
          leagueId: team.leagueId,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  }, [teams, scores]);

  // Create league filter options and apply filter
  const [selectedLeague, setSelectedLeague] = React.useState<string>("all");

  const leagueOptions = useMemo(() => [
    { id: "all", name: "All Leagues" },
    ...((allLeagues ?? []) as { id: number; name: string }[]),
  ], [allLeagues]);

  const filteredLeaderboard = useMemo(() => {
    if (selectedLeague === "all") return leaderboard;
    const leagueIdToFilter = parseInt(selectedLeague);
    return leaderboard.filter((entry) => entry.leagueId === leagueIdToFilter);
  }, [leaderboard, selectedLeague]);

  // Error/Loading logic
  const totalErrors = [leagueError, teamsError, scoresError].filter(Boolean).length;
  const hasErrors = totalErrors > 0;
  const loading = leagueLoading || teamsLoading || scoresLoading;
  const hasData = !loading && !hasErrors && filteredLeaderboard.length > 0;
  const noData = !loading && !hasErrors && filteredLeaderboard.length === 0;

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
                IPL Fantasy Leaderboard
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Filter by league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueOptions.map((league) => (
                      <SelectItem key={league.id} value={league.id.toString()}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="py-8 text-center text-muted-foreground">
                Loading leaderboard data...
              </div>
            )}
            {hasErrors && (
              <div className="py-8 text-center text-red-500">
                Error loading leaderboard data: {totalErrors} error(s) encountered. Please check the console for details.
              </div>
            )}
            {noData && (
              <div className="py-8 text-center text-muted-foreground">
                No teams found.
              </div>
            )}
            {hasData && (
              <LeaderboardTable 
                entries={filteredLeaderboard}
                leagueId={selectedLeague !== "all" ? parseInt(selectedLeague) : null}
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
