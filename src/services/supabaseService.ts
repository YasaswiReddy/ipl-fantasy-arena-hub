
import { supabase } from "@/integrations/supabase/client";
import { League, Player, FantasyTeam, Match, PlayerPerformance } from "@/types";
import { dataTransformService } from "./dataTransformService";

export const supabaseService = {
  // League operations
  async createLeague(name: string) {
    const { data, error } = await supabase
      .from('leagues')
      .insert([{ name }])
      .select()
      .single();
      
    if (error) throw error;
    return dataTransformService.transformLeague(data);
  },
  
  async getLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        fantasy_teams (count)
      `);
      
    if (error) throw error;
    return data.map(league => dataTransformService.transformLeague(league));
  },
  
  // Fantasy Team operations
  async createFantasyTeam(leagueId: number, name: string) {
    const { data, error } = await supabase
      .from('fantasy_teams')
      .insert([{ 
        league_id: leagueId, 
        name 
      }])
      .select()
      .single();
      
    if (error) throw error;
    return dataTransformService.transformFantasyTeam(data);
  },
  
  async getFantasyTeam(teamId: number): Promise<FantasyTeam> {
    const { data, error } = await supabase
      .from('fantasy_teams')
      .select(`
        *,
        players:fantasy_team_players(
          player:players(*)
        )
      `)
      .eq('id', teamId)
      .single();
      
    if (error) throw error;
    return dataTransformService.transformFantasyTeam(data);
  },
  
  async getFantasyTeams(): Promise<FantasyTeam[]> {
    const { data, error } = await supabase
      .from('fantasy_teams')
      .select(`
        *,
        players:fantasy_team_players(
          player:players(*)
        )
      `);
      
    if (error) throw error;
    return data.map(team => dataTransformService.transformFantasyTeam(team));
  },
  
  // Player operations
  async getPlayers(filters?: { teamId?: number; search?: string }): Promise<Player[]> {
    let query = supabase
      .from('players')
      .select('*');
      
    if (filters?.teamId) {
      query = query.eq('team_id', filters.teamId);
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(player => dataTransformService.transformPlayer(player));
  },
  
  // Match operations
  async getMatches(type: 'recent' | 'upcoming', limit: number = 5): Promise<Match[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*)
      `)
      .order('match_date', type === 'recent' ? { ascending: false } : { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    return data.map(match => dataTransformService.transformMatch(match));
  },
  
  // Cricket data fetch operations
  async fetchCricketData(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('auto-fetch-cricket-data', {
        body: { action: 'fetch-initial-data' }
      });
      
      if (error) throw error;
      return { 
        success: true, 
        message: `Successfully fetched cricket data: ${data.result.fixtures_count} fixtures, ${data.result.players_count} players` 
      };
    } catch (error) {
      console.error("Error fetching cricket data:", error);
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` };
    }
  },
  
  async checkAndUpdateFixtures(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('auto-fetch-cricket-data', {
        body: { action: 'check-and-update' }
      });
      
      if (error) throw error;
      return { 
        success: true, 
        message: `Fixtures checked: ${data.result.total_fixtures}, Live updates: ${data.result.live_updated}, Past matches updated: ${data.result.past_matches_updated}` 
      };
    } catch (error) {
      console.error("Error updating fixtures:", error);
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` };
    }
  },
  
  async setupCricketUpdateScheduler(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Attempting to set up cricket update scheduler...");
      
      // First check if the required database functions exist
      const { data: pgExtensions, error: pgExtError } = await supabase
        .from('pg_extension')
        .select('name')
        .in('name', ['pg_cron', 'pg_net']);
      
      if (pgExtError) {
        console.error("Failed to check PostgreSQL extensions:", pgExtError);
        return {
          success: false,
          message: `Database configuration error: ${pgExtError.message}`
        };
      }
      
      // Check if both extensions are present
      const extensionNames = pgExtensions?.map(ext => ext.name) || [];
      if (!extensionNames.includes('pg_cron') || !extensionNames.includes('pg_net')) {
        console.error("Required extensions not enabled:", {
          pg_cron: extensionNames.includes('pg_cron'),
          pg_net: extensionNames.includes('pg_net')
        });
        return {
          success: false,
          message: `Required database extensions not enabled. Please enable pg_cron and pg_net in your Supabase project.`
        };
      }
      
      const response = await supabase.functions.invoke('schedule-cricket-updates', {
        body: { timestamp: new Date().toISOString() }
      });
      
      console.log("Edge function response:", response);
      
      if (response.error) {
        console.error("Edge function returned an error:", response.error);
        return { 
          success: false, 
          message: `Error: ${response.error.message || 'Unknown error from edge function'}`
        };
      }
      
      if (!response.data) {
        console.error("Edge function returned no data");
        return { 
          success: false, 
          message: 'Error: Edge function returned no data'
        };
      }
      
      return { 
        success: true, 
        message: `Cricket update scheduler configured: Updates will run every 5 minutes` 
      };
    } catch (error) {
      console.error("Error setting up scheduler:", error);
      return { 
        success: false, 
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  }
};
