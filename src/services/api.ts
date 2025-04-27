import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "./supabaseService";
import { 
  League, Player, FantasyTeam, Match, LeaderboardEntry, 
  TopPerformer, PlayerPerformance, PlayerDetail 
} from "@/types";

interface FetchOptions extends RequestInit {
  suppressErrorToast?: boolean;
}

const baseUrl = '/api';

// Adding this method to get player performance data from Supabase
async function getPlayerPerformancesFromDB(playerId: number): Promise<PlayerPerformance[]> {
  try {
    // Fetch all fantasy scores for this player
    const { data: scoresData, error: scoresError } = await supabase
      .from("fantasy_scores")
      .select(`
        id, 
        fixture_id, 
        player_id, 
        batting_points, 
        bowling_points, 
        fielding_points, 
        total_points,
        fixtures(
          id,
          starting_at,
          local_team_id,
          visitor_team_id
        )
      `)
      .eq("player_id", playerId)
      .order("fixture_id", { ascending: false });

    if (scoresError) throw scoresError;

    // Get player details
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, name, role, team_id")
      .eq("id", playerId)
      .single();

    if (playerError) throw playerError;

    // Get team names for fixtures
    const fixtureIds = scoresData.map(score => score.fixture_id);
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name");

    if (teamsError) throw teamsError;

    // Create a map of team IDs to team names
    const teamMap: Record<number, string> = {};
    teamsData.forEach((team: any) => {
      teamMap[team.id] = team.name;
    });

    // Get batting details
    const { data: battingData, error: battingError } = await supabase
      .from("batting_performances")
      .select("fixture_id, runs_scored")
      .eq("player_id", playerId)
      .in("fixture_id", fixtureIds);

    if (battingError) throw battingError;

    // Create a map of fixture IDs to runs
    const runsMap: Record<number, number> = {};
    battingData.forEach((batting: any) => {
      runsMap[batting.fixture_id] = batting.runs_scored;
    });

    // Get bowling details
    const { data: bowlingData, error: bowlingError } = await supabase
      .from("bowling_performances")
      .select("fixture_id, wickets")
      .eq("player_id", playerId)
      .in("fixture_id", fixtureIds);

    if (bowlingError) throw bowlingError;

    // Create a map of fixture IDs to wickets
    const wicketsMap: Record<number, number> = {};
    bowlingData.forEach((bowling: any) => {
      wicketsMap[bowling.fixture_id] = bowling.wickets;
    });

    // Get fielding details
    const { data: fieldingData, error: fieldingError } = await supabase
      .from("fielding_performances")
      .select("fixture_id, catches, stumpings")
      .eq("player_id", playerId)
      .in("fixture_id", fixtureIds);

    if (fieldingError) throw fieldingError;

    // Create maps for catches and stumpings
    const catchesMap: Record<number, number> = {};
    const stumpingsMap: Record<number, number> = {};
    fieldingData.forEach((fielding: any) => {
      catchesMap[fielding.fixture_id] = fielding.catches;
      stumpingsMap[fielding.fixture_id] = fielding.stumpings;
    });

    // Transform data into player performances
    return scoresData.map(score => {
      const fixture = score.fixtures;
      const fixtureId = score.fixture_id;
      
      // Determine the opponent team
      const isLocalTeam = playerData.team_id === fixture.local_team_id;
      const opponentTeamId = isLocalTeam ? fixture.visitor_team_id : fixture.local_team_id;
      const opponentName = teamMap[opponentTeamId] || "Unknown Team";
      
      return {
        matchId: fixtureId,
        date: fixture.starting_at,
        opponent: opponentName,
        points: score.total_points,
        runs: runsMap[fixtureId] || 0,
        wickets: wicketsMap[fixtureId] || 0,
        catches: catchesMap[fixtureId] || 0,
        stumpings: stumpingsMap[fixtureId] || 0,
        name: playerData.name,
        role: playerData.role as "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper",
      };
    });
  } catch (error) {
    console.error("Error fetching player performances:", error);
    toast.error("Failed to fetch player performance data");
    throw error;
  }
}

// Adding a method to calculate player ranking
// Adding a method to calculate player ranking
async function getPlayerRanking(playerId: number): Promise<{ rank: number; totalPlayers: number; percentile: number }> {
  try {
    // Get all players' total points by directly querying fantasy_scores
    const { data, error } = await supabase
      .from('fantasy_scores')
      .select('player_id, total_points');

    if (error) throw error;

    // Aggregate scores by player (sum of all matches)
    const playerScoresMap: Record<number, number> = {};
    if (data) {
      for (const score of data) {
        if (score.player_id) {
          if (!playerScoresMap[score.player_id]) {
            playerScoresMap[score.player_id] = 0;
          }
          playerScoresMap[score.player_id] += score.total_points || 0;
        }
      }
    }

    // Convert to array for sorting
    const playersWithScores = Object.entries(playerScoresMap).map(([id, points]) => ({
      player_id: parseInt(id),
      total_points: points
    }));
    
    // Sort players by points in descending order
    const sortedPlayers = playersWithScores.sort((a, b) => b.total_points - a.total_points);
    
    // Find the rank of our player
    const playerIndex = sortedPlayers.findIndex((p) => p.player_id === playerId);
    
    if (playerIndex === -1) {
      return { rank: 0, totalPlayers: sortedPlayers.length, percentile: 0 };
    }
    
    // Calculate percentile (higher is better)
    const rank = playerIndex + 1;
    const totalPlayers = sortedPlayers.length;
    const percentile = Math.round(((totalPlayers - rank) / totalPlayers) * 100);
    
    return { rank, totalPlayers, percentile };
  } catch (error) {
    console.error("Error calculating player ranking:", error);
    // Return a default value instead of throwing
    return { rank: 0, totalPlayers: 0, percentile: 0 };
  }
}

class ApiService {
  async fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = new Headers(options.headers);
    if (session?.access_token) {
      headers.append('Authorization', `Bearer ${session.access_token}`);
    }
    headers.append('Content-Type', 'application/json');
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      
      if (response.status === 401) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Something went wrong';
        
        if (!options.suppressErrorToast) {
          toast.error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      if (!options.suppressErrorToast) {
        toast.error((error as Error).message || 'Network error');
      }
      throw error;
    }
  }
  
  async login(email: string, password: string) {
    return this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      suppressErrorToast: true,
    });
  }
  
  async getLeagues(): Promise<League[]> {
    try {
      return await supabaseService.getLeagues();
    } catch (error) {
      toast.error("Failed to fetch leagues");
      throw error;
    }
  }
  
  async getTeams() {
    try {
      return await supabaseService.getPlayers();
    } catch (error) {
      toast.error("Failed to fetch teams");
      throw error;
    }
  }
  
  async getFantasyTeam(teamId: number): Promise<FantasyTeam> {
    try {
      return await supabaseService.getFantasyTeam(teamId);
    } catch (error) {
      toast.error("Failed to fetch fantasy team");
      throw error;
    }
  }
  
  async getPlayers(params: { teamId?: number; search?: string } = {}): Promise<Player[]> {
    try {
      return await supabaseService.getPlayers(params);
    } catch (error) {
      toast.error("Failed to fetch players");
      throw error;
    }
  }
  
  async getMatches(type: 'recent' | 'upcoming', limit: number = 5): Promise<Match[]> {
    try {
      return await supabaseService.getMatches(type, limit);
    } catch (error) {
      toast.error("Failed to fetch matches");
      throw error;
    }
  }
  
  async getOverallLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.fetchWithAuth('/fantasy/leaderboard');
  }
  
  async getLeagueLeaderboard(leagueId: number): Promise<LeaderboardEntry[]> {
    return this.fetchWithAuth(`/fantasy/leaderboard?leagueId=${leagueId}`);
  }
  
  async getPlayerPerformances(playerId: number): Promise<PlayerPerformance[]> {
    // Use the direct DB function instead of the API endpoint
    return getPlayerPerformancesFromDB(playerId);
  }
  
  async getPlayerRanking(playerId: number) {
    return getPlayerRanking(playerId);
  }
  
  async getTopPerformers(metric: 'runs' | 'wickets' | 'economy'): Promise<TopPerformer[]> {
    return this.fetchWithAuth(`/stats/top?metric=${metric}`);
  }

  // New method to get complete player details including performances
  async getPlayerDetail(playerId: number): Promise<PlayerDetail> {
    try {
      // Get player basic info
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, name, role, team_id, photo_url")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;

      // Get team info
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .eq("id", playerData.team_id)
        .single();

      if (teamError) throw teamError;

      // Get performances
      const performances = await this.getPlayerPerformances(playerId);
      
      // Calculate season points
      const seasonPoints = performances.reduce((sum, p) => sum + p.points, 0);

      // Validate role
      const validRoles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"] as const;
      const role = playerData.role || "All-Rounder";
      const validRole = validRoles.includes(role as any) 
        ? role as "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper"
        : "All-Rounder";

      return {
        id: playerId,
        name: playerData.name,
        role: validRole,
        iplTeam: teamData.name,
        iplTeamLogo: teamData.logo_url || "/placeholder.svg",
        photoUrl: playerData.photo_url || "/placeholder.svg",
        seasonPoints,
        performances
      };
    } catch (error) {
      console.error("Error fetching player details:", error);
      toast.error("Failed to fetch player details");
      throw error;
    }
  }
}

export const api = new ApiService();