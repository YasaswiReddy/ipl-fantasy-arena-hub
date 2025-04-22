
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
      const { data, error } = await supabase.functions.invoke('schedule-cricket-updates', {
        body: {}
      });
      
      if (error) throw error;
      return { 
        success: true, 
        message: `Cricket update scheduler configured: Updates will run every 5 minutes` 
      };
    } catch (error) {
      console.error("Error setting up scheduler:", error);
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` };
    }
  }
};
