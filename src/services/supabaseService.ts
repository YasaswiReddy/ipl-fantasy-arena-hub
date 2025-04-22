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
      console.log("Initiating cricket data fetch...");
      
      const response = await supabase.functions.invoke('auto-fetch-cricket-data', {
        body: { action: 'fetch-initial-data' }
      });
      
      console.log("Response from edge function:", response);
      
      if (response.error) {
        console.error("Error from edge function:", response.error);
        return { 
          success: false, 
          message: `Error from edge function: ${response.error.message || 'Unknown error'}` 
        };
      }
      
      const data = response.data;
      
      if (!data || !data.result) {
        return { 
          success: false, 
          message: "Invalid response from server" 
        };
      }
      
      // Verify fixtures were actually saved
      const { count: fixtureCount, error: countError } = await supabase
        .from('fixtures')
        .select('*', { count: 'exact', head: true });
      
      console.log("Fixture count check result:", fixtureCount, countError);
      
      if (countError) {
        console.error("Error checking fixture count:", countError);
        return {
          success: true,
          message: `Cricket data fetch reported: ${data.result.fixtures_count} fixtures, ${data.result.players_count} players, but couldn't verify database count. Error: ${countError.message}`
        };
      }
      
      return { 
        success: true, 
        message: `Successfully fetched cricket data: ${data.result.fixtures_count} fixtures (${data.result.fixtures_saved} saved), ${data.result.players_count} players (${data.result.players_saved} saved). Database contains ${fixtureCount} fixtures total.` 
      };
    } catch (error) {
      console.error("Error fetching cricket data:", error);
      return { 
        success: false, 
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  },
  
  async checkAndUpdateFixtures(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Checking and updating fixtures...");
      
      const response = await supabase.functions.invoke('auto-fetch-cricket-data', {
        body: { action: 'check-and-update' }
      });
      
      console.log("Response from edge function:", response);
      
      if (response.error) {
        console.error("Error from edge function:", response.error);
        return { 
          success: false, 
          message: `Error from edge function: ${response.error.message || 'Unknown error'}` 
        };
      }
      
      const data = response.data;
      
      if (!data || !data.result) {
        return { 
          success: false, 
          message: "Invalid response from server" 
        };
      }
      
      return { 
        success: true, 
        message: `Fixtures checked: ${data.result.total_fixtures}, Live updates: ${data.result.live_updated}, Past matches updated: ${data.result.past_matches_updated}` 
      };
    } catch (error) {
      console.error("Error updating fixtures:", error);
      return { 
        success: false, 
        message: `Error: ${error.message || 'Unknown error'}` 
      };
    }
  },
  
  async setupCricketUpdateScheduler(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Attempting to set up cricket update scheduler...");
      
      // Instead of checking extensions, directly call the edge function
      // The function will handle checking for pg_cron and pg_net itself
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
  },
  
  async processHistoricalMatches(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Starting to process historical matches...");
      
      // Get all past fixtures
      const { data: fixtures, error: fixturesError } = await supabase
        .from('fixtures')
        .select('id, starting_at')
        .lt('starting_at', new Date().toISOString())
        .order('starting_at', { ascending: false });
      
      if (fixturesError) {
        console.error("Error fetching fixtures:", fixturesError);
        return { 
          success: false, 
          message: `Error fetching fixtures: ${fixturesError.message}` 
        };
      }

      console.log(`Found ${fixtures?.length || 0} historical fixtures to process`);
      
      // Process each fixture
      let processedCount = 0;
      let errorCount = 0;
      
      if (fixtures && fixtures.length > 0) {
        for (const fixture of fixtures) {
          try {
            console.log(`Processing fixture ${fixture.id} from ${fixture.starting_at}`);
            
            // Call the edge function to process this fixture
            const response = await supabase.functions.invoke('fetch-cricket-performances', {
              body: { fixture_id: fixture.id }
            });
            
            if (response.error) {
              console.error(`Error processing fixture ${fixture.id}:`, response.error);
              errorCount++;
            } else {
              processedCount++;
              console.log(`Successfully processed fixture ${fixture.id}`);
            }
            
            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`Error processing fixture ${fixture.id}:`, error);
            errorCount++;
          }
        }
        
        return {
          success: true,
          message: `Processed ${processedCount} fixtures successfully. ${errorCount} fixtures had errors.`
        };
      } else {
        // If no fixtures were found
        return {
          success: false,
          message: "No historical fixtures found to process. Use 'Fetch Initial Cricket Data' first."
        };
      }
      
    } catch (error) {
      console.error("Error processing historical matches:", error);
      return {
        success: false,
        message: `Error: ${error.message || 'Unknown error occurred'}`
      };
    }
  }
};
