
import { supabase } from "@/integrations/supabase/client";
import { League, Player, FantasyTeam, Match, PlayerPerformance } from "@/types";

export const supabaseService = {
  // League operations
  async createLeague(name: string) {
    const { data, error } = await supabase
      .from('leagues')
      .insert([{ name }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async getLeagues() {
    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        fantasy_teams (count)
      `);
      
    if (error) throw error;
    return data;
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
    return data;
  },
  
  async getFantasyTeam(teamId: number) {
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
    return data;
  },
  
  // Player operations
  async getPlayers(filters?: { teamId?: number; search?: string }) {
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
    return data;
  },
  
  // Match operations
  async getMatches(type: 'recent' | 'upcoming', limit: number = 5) {
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
    return data;
  }
};
