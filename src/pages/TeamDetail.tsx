
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
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
import { cn } from "@/lib/utils";

const TeamDetail = () => {
  const { leagueId, teamId } = useParams<{ leagueId: string; teamId: string }>();
  const navigate = useNavigate();
  const teamIdNum = teamId ? parseInt(teamId) : null;

  // Get team & player ids
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["fantasy-team-detail", teamIdNum],
    queryFn: async () => {
      if (!teamIdNum) throw new Error("Team ID required");
      const { data, error } = await supabase
        .from("fantasy_teams")
        .select(`
          id, name, captain_id, vice_captain_id, league_id,
          fantasy_team_players (
            player_id
          )
        `)
        .eq("id", teamIdNum)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        captainId: data.captain_id,
        viceCaptainId: data.vice_captain_id,
        leagueId: data.league_id,
        players: (data.fantasy_team_players || []).map((p: any) => p.player_id)
      };
    },
    enabled: !!teamIdNum,
  });

  // Fetch players' details (name, team, etc.)
  const { data: players = [] } = useQuery({
    queryKey: ["team-players", team?.players],
    queryFn: async () => {
      if (!team?.players?.length) return [];
      const { data, error } = await supabase
        .from("players")
        .select("id, name, team_id, photo_url")
        .in("id", team.players);
      if (error) throw error;
      return data;
    },
    enabled: !!team?.players?.length,
  });

  // Fetch IPL teams map
  const { data: iplTeamsMap = {} } = useQuery({
    queryKey: ["ipl-teams-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name");
      if (error) throw error;
      const map: Record<number, { name: string }> = {};
      data.forEach((t: any) => { map[t.id] = { name: t.name }; });
      return map;
    }
  });

  // Fetch every player's fantasy score breakdown (batting/bowling/fielding), summed for all fixtures!
  const { data: playerScores = [] } = useQuery({
    queryKey: ["team-player-scores", team?.players],
    queryFn: async () => {
      if (!team?.players?.length) return [];
      const { data, error } = await supabase
        .from("fantasy_scores")
        .select("player_id, batting_points, bowling_points, fielding_points, total_points")
        .in("player_id", team.players);

      if (error) throw error;

      // sum per player_id
      const aggregate: Record<number, any> = {};
      data.forEach((score: any) => {
        const pid = score.player_id;
        if (!aggregate[pid]) {
          aggregate[pid] = { batting: 0, bowling: 0, fielding: 0, total: 0 };
        }
        aggregate[pid].batting += score.batting_points || 0;
        aggregate[pid].bowling += score.bowling_points || 0;
        aggregate[pid].fielding += score.fielding_points || 0;
        aggregate[pid].total += score.total_points || 0;
      });
      return aggregate;
    },
    enabled: !!team?.players?.length,
  });

  const handleBackClick = () => {
    if (leagueId) {
      navigate(`/league/${leagueId}/leaderboard`);
    } else {
      navigate("/home");
    }
  };

  // --- Combine player, team, and calculated score info ---
  const playerDisplayData = (() => {
    if (!players.length || !team) return [];
    // Enrich each player with score, C/VC info, and team name
    return players.map((p: any) => {
      const score = playerScores?.[p.id] || {};
      const isC = p.id === team.captainId;
      const isVC = p.id === team.viceCaptainId;
      // multiplier for total only
      let total = score.total || 0;
      if (isC) {
        total = total * 2;
      } else if (isVC) {
        total = Math.round(total * 1.5);
      }
      return {
        ...p,
        iplTeamName: iplTeamsMap?.[p.team_id]?.name || "",
        isC,
        isVC,
        batting: score.batting || 0,
        bowling: score.bowling || 0,
        fielding: score.fielding || 0,
        total,
      };
    }).sort((a, b) => b.total - a.total); // sort by total desc
  })();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Leaderboard
          </Button>
        </div>

        {teamLoading ? (
          <div className="py-12 text-center">Loading team details...</div>
        ) : team ? (
          <>
            <Card className="mb-6">
              <CardHeader className="bg-ipl-gradient text-white">
                <CardTitle>{team.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <span className="text-muted-foreground text-sm">
                  Team ID: {team.id}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Team Players & Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>IPL Team</TableHead>
                      <TableHead className="text-right">Batting</TableHead>
                      <TableHead className="text-right">Bowling</TableHead>
                      <TableHead className="text-right">Fielding</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerDisplayData.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              src={p.photo_url || "/placeholder.svg"}
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover mr-2"
                            />
                            <span
                              className={cn(
                                "font-medium cursor-pointer hover:text-primary hover:underline",
                                p.isC && "text-ipl-orange",
                                p.isVC && "text-ipl-blue"
                              )}
                              onClick={() => navigate(`/player/${p.id}`)}
                            >
                              {p.name}
                              {p.isC ? <span className="ml-2 text-xs bg-ipl-orange/20 px-2 py-0.5 rounded">C</span> : null}
                              {p.isVC ? <span className="ml-2 text-xs bg-ipl-blue/20 px-2 py-0.5 rounded">VC</span> : null}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{p.iplTeamName}</span>
                        </TableCell>
                        <TableCell className="text-right">{p.batting}</TableCell>
                        <TableCell className="text-right">{p.bowling}</TableCell>
                        <TableCell className="text-right">{p.fielding}</TableCell>
                        <TableCell className="text-right font-bold">{p.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-2 text-sm text-muted-foreground italic">
                  <span className="inline-flex items-center">
                    <span className="w-3 h-3 inline-block rounded-full bg-ipl-orange mr-2"></span> Captain &nbsp;
                  </span>
                  <span className="inline-flex items-center ml-4">
                    <span className="w-3 h-3 inline-block rounded-full bg-ipl-blue mr-2"></span> Vice Captain
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <span>
                    Captain scores ×2. Vice Captain scores ×1.5.
                  </span>
                </div>
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
