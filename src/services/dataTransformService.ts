
import { League, Player, FantasyTeam, Match, PlayerPerformance } from "@/types";

/**
 * This service transforms data from Supabase database format to the application's type format
 */
export const dataTransformService = {
  // Transform league data
  transformLeague(dbLeague: any): League {
    return {
      id: dbLeague.id,
      name: dbLeague.name,
      ownerName: dbLeague.owner_id || "Unknown", // In a real app, we would fetch the owner's name
      memberCount: dbLeague.fantasy_teams?.count || 0
    };
  },

  // Transform match data
  transformMatch(dbMatch: any): Match {
    return {
      id: dbMatch.id,
      homeTeam: dbMatch.home_team?.name || "Unknown Team",
      awayTeam: dbMatch.away_team?.name || "Unknown Team",
      homeTeamLogo: dbMatch.home_team?.logo_url || "/placeholder.svg",
      awayTeamLogo: dbMatch.away_team?.logo_url || "/placeholder.svg",
      venue: dbMatch.venue,
      date: dbMatch.match_date?.split('T')[0] || "",
      time: dbMatch.match_date ? new Date(dbMatch.match_date).toLocaleTimeString() : "",
      status: dbMatch.status as 'upcoming' | 'live' | 'completed' || 'upcoming'
    };
  },

  // Transform player data
  transformPlayer(dbPlayer: any): Player {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      role: dbPlayer.role as 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper',
      iplTeam: dbPlayer.team_id ? "IPL Team" : "Unknown", // We should fetch the team name here
      iplTeamLogo: "/placeholder.svg", // Placeholder for logo
      photoUrl: dbPlayer.photo_url || "/placeholder.svg",
      seasonPoints: dbPlayer.season_points || 0
    };
  },

  // Transform fantasy team data
  transformFantasyTeam(dbTeam: any): FantasyTeam {
    // Extract players from nested data
    const players: Player[] = dbTeam.players?.map((item: any) => 
      this.transformPlayer(item.player)
    ) || [];

    return {
      id: dbTeam.id,
      name: dbTeam.name,
      ownerName: dbTeam.owner_id || "Unknown Owner", // Should fetch actual owner name
      captainId: dbTeam.captain_id || 0,
      viceCaptainId: dbTeam.vice_captain_id || 0,
      players: players,
      totalPoints: dbTeam.total_points || 0
    };
  }
};
