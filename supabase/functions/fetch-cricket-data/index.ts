
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Database } from '../types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_TOKEN = Deno.env.get('SPORTMONKS_API_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient<Database>(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchAndStoreFixtures(leagueId: number, seasonId: number) {
  const url = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=${leagueId}&filter[season_id]=${seasonId}&api_token=${API_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();
  const fixtures = data.data || [];

  for (const fixture of fixtures) {
    await supabase
      .from('fixtures')
      .upsert({
        id: fixture.id,
        round: fixture.round,
        local_team_id: fixture.localteam_id,
        visitor_team_id: fixture.visitorteam_id,
        starting_at: fixture.starting_at,
      });
  }

  return fixtures;
}

async function fetchAndStorePlayers(teamIds: number[], seasonId: number) {
  const players = [];
  
  for (const teamId of teamIds) {
    const url = `https://cricket.sportmonks.com/api/v2.0/teams/${teamId}/squad/${seasonId}?api_token=${API_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    const squad = data.data?.squad || [];

    for (const player of squad) {
      const playerData = {
        id: player.id,
        name: player.fullname || `${player.firstname} ${player.lastname}`.trim(),
        team_id: teamId,
        role: player.position?.name || null,
        photo_url: player.image_path || null,
      };

      await supabase
        .from('players')
        .upsert(playerData);

      players.push(playerData);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return players;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!API_TOKEN) {
      throw new Error('SPORTMONKS_API_TOKEN is required');
    }

    const { league_id, season_id, team_ids } = await req.json();

    if (!league_id || !season_id || !team_ids) {
      throw new Error('league_id, season_id, and team_ids are required');
    }

    // Fetch and store fixtures
    const fixtures = await fetchAndStoreFixtures(league_id, season_id);

    // Fetch and store players
    const players = await fetchAndStorePlayers(team_ids, season_id);

    return new Response(
      JSON.stringify({ 
        message: 'Data fetched and stored successfully',
        fixtures_count: fixtures.length,
        players_count: players.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
