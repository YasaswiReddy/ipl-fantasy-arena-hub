
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

  // Fetch fantasy teams for the league (with players, captain, vice)
  const { data: teams = [], isLoading: teamsLoading } = useQuery<TeamWithPlayers[]>({
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

      if (error || !data) {
        console.error("Error fetching teams:", error);
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
  });

  // Fetch all fantasy scores for these teams' player_ids
  const allPlayerIds = useMemo(
    () =>
      teams
        .flatMap((t) => t.players?.map((p) => p.id) || [])
        .filter(Boolean),
    [teams]
  );
  const { data: scores = [], isLoading: scoresLoading } = useQuery<any[]>({
    queryKey: ["fantasyScores", allPlayerIds],
    queryFn: async () => {
      if (!allPlayerIds.length) return [];
      const { data, error } = await supabase
        .from("fantasy_scores")
        .select(`player_id, total_points`)
        .in("player_id", allPlayerIds);
      if (error || !data) {
        console.error("Error fetching fantasy scores:", error);
        return [];
      }
      return data;
    },
    enabled: !!allPlayerIds.length,
  });

  // Calculate team scores (adding 2x for captain, 1.5x for vice captain)
  const leaderboard: EntryWithScore[] = useMemo(() => {
    if (!teams.length || !scores.length) return [];

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
      .map((entry, idx, arr) => ({
        ...entry,
        rank: idx + 1,
      }));
  }, [teams, scores]);

  // For group filter (by prefix)
  const groups = useMemo(() => {
    return leaderboard.reduce((acc: string[], entry) => {
      const groupName = entry.teamName.split(' ')[0];
      if (!acc.includes(groupName)) {
        acc.push(groupName);
      }
      return acc;
    }, ['All']);
  }, [leaderboard]);

  const [selectedGroup, setSelectedGroup] = React.useState<string>('All');

  const filteredLeaderboard = useMemo(() => {
    if (selectedGroup === 'All') return leaderboard;
    return leaderboard.filter((entry) =>
      entry.teamName.startsWith(selectedGroup)
    );
  }, [leaderboard, selectedGroup]);

  const loading = teamsLoading || scoresLoading;

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
                League Leaderboard
              </CardTitle>
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
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading leaderboard data...
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No teams found in this league.
              </div>
            ) : (
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
