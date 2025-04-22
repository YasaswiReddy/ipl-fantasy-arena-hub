
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_TOKEN = Deno.env.get('SPORTMONKS_API_TOKEN');
const LEAGUE_ID = 1;
const SEASON_ID = 1689;
const TEAM_IDS = [2, 3, 4, 5, 6, 7, 8, 9, 1979, 1976];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!API_TOKEN) {
      throw new Error('SPORTMONKS_API_TOKEN is required');
    }

    // Fetch fixtures
    const fixturesUrl = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=${LEAGUE_ID}&filter[season_id]=${SEASON_ID}&api_token=${API_TOKEN}`;
    const fixturesResponse = await fetch(fixturesUrl);
    const fixturesData = await fixturesResponse.json();
    const fixtures = fixturesData.data || [];

    // Fetch players for each team
    const playersData = [];
    for (const teamId of TEAM_IDS) {
      const playersUrl = `https://cricket.sportmonks.com/api/v2.0/teams/${teamId}/squad/${SEASON_ID}?api_token=${API_TOKEN}`;
      const playerResponse = await fetch(playersUrl);
      const playerData = await playerResponse.json();
      const squad = playerData.data?.squad || [];
      
      playersData.push(...squad.map(player => ({
        id: player.id,
        name: player.fullname || `${player.firstname} ${player.lastname}`.trim(),
        team_id: teamId,
        role: player.position?.name || null,
        photo_url: player.image_path || null,
      })));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert fixtures
    const fixtureUpserts = fixtures.map(fixture => 
      supabase.from('fixtures').upsert({
        id: fixture.id,
        round: fixture.round,
        local_team_id: fixture.localteam_id,
        visitor_team_id: fixture.visitorteam_id,
        starting_at: fixture.starting_at,
      })
    );

    // Upsert players
    const playerUpserts = playersData.map(player => 
      supabase.from('players').upsert(player)
    );

    // Wait for all upserts to complete
    await Promise.all([...fixtureUpserts, ...playerUpserts]);

    return new Response(
      JSON.stringify({ 
        message: 'Data fetched and stored successfully',
        fixtures_count: fixtures.length,
        players_count: playersData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
