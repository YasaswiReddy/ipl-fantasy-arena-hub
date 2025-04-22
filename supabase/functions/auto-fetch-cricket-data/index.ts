
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Function to fetch initial cricket data
    async function fetchCricketData() {
      console.log("Fetching initial cricket data...");
      
      // Fetch fixtures
      const fixturesUrl = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=${LEAGUE_ID}&filter[season_id]=${SEASON_ID}&api_token=${API_TOKEN}`;
      console.log(`Fetching fixtures from URL: ${fixturesUrl.replace(API_TOKEN, 'API_TOKEN_HIDDEN')}`);
      
      const fixturesResponse = await fetch(fixturesUrl);
      
      if (!fixturesResponse.ok) {
        const errorText = await fixturesResponse.text();
        console.error(`API Error (${fixturesResponse.status}): ${errorText}`);
        throw new Error(`Failed to fetch fixtures: ${fixturesResponse.status} ${errorText}`);
      }
      
      const fixturesData = await fixturesResponse.json();
      console.log("Fixtures API response structure:", JSON.stringify(Object.keys(fixturesData)));
      
      const fixtures = fixturesData.data || [];
      console.log(`Fetched ${fixtures.length} fixtures from API. First fixture:`, fixtures.length > 0 ? JSON.stringify(fixtures[0]) : "No fixtures");

      // Fetch players for each team
      const playersData = [];
      for (const teamId of TEAM_IDS) {
        const playersUrl = `https://cricket.sportmonks.com/api/v2.0/teams/${teamId}/squad/${SEASON_ID}?api_token=${API_TOKEN}`;
        const playerResponse = await fetch(playersUrl);
        
        if (!playerResponse.ok) {
          console.error(`Failed to fetch players for team ${teamId}: ${playerResponse.status}`);
          continue; // Skip this team but continue with others
        }
        
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
      
      console.log(`Fetched ${playersData.length} players from API`);

      // Verify Supabase connection - using a simple table check instead of RPC
      try {
        console.log("Verifying Supabase connection...");
        const { error: connectionError } = await supabase
          .from('fixtures')
          .select('id')
          .limit(1);
          
        if (connectionError) {
          console.error("Supabase connection error:", connectionError);
          throw new Error(`Database connection error: ${connectionError.message}`);
        }
        console.log("Supabase connection verified successfully");
      } catch (e) {
        console.error("Error checking Supabase connection:", e);
        throw new Error(`Database verification error: ${e.message}`);
      }

      // Upsert fixtures with individual error handling
      let successfulFixtureUpserts = 0;
      let fixtureErrorCount = 0;
      
      console.log("Upserting fixtures to database...");
      for (const fixture of fixtures) {
        try {
          // Clean and parse the round field
          let roundValue = null;
          if (fixture.round) {
            // Try to extract a number from the round string (e.g., "48th Match" -> 48)
            const roundMatch = String(fixture.round).match(/^(\d+)/);
            if (roundMatch && roundMatch[1]) {
              roundValue = parseInt(roundMatch[1], 10);
            }
          }
          
          const fixtureData = {
            id: fixture.id,
            round: roundValue,
            local_team_id: fixture.localteam_id,
            visitor_team_id: fixture.visitorteam_id,
            starting_at: fixture.starting_at,
          };
          
          console.log(`Upserting fixture ${fixture.id}, data:`, JSON.stringify(fixtureData));
          
          const { data, error } = await supabase
            .from('fixtures')
            .upsert(fixtureData)
            .select();
          
          if (error) {
            console.error(`Error upserting fixture ${fixture.id}:`, error);
            fixtureErrorCount++;
          } else {
            console.log(`Successfully upserted fixture ${fixture.id}. Response:`, data ? JSON.stringify(data) : "No data returned");
            successfulFixtureUpserts++;
          }
        } catch (err) {
          console.error(`Exception upserting fixture ${fixture.id}:`, err);
          fixtureErrorCount++;
        }
      }

      // Upsert players with individual error handling
      let successfulPlayerUpserts = 0;
      let playerErrorCount = 0;
      
      console.log("Upserting players to database...");
      for (const player of playersData) {
        try {
          const { error } = await supabase.from('players').upsert(player);
          
          if (error) {
            console.error(`Error upserting player ${player.id}:`, error);
            playerErrorCount++;
          } else {
            successfulPlayerUpserts++;
          }
        } catch (err) {
          console.error(`Exception upserting player ${player.id}:`, err);
          playerErrorCount++;
        }
      }

      // Verify fixtures were saved
      try {
        const { count, error: checkError } = await supabase
          .from('fixtures')
          .select('*', { count: 'exact', head: true });
        
        if (checkError) {
          console.error("Error checking saved fixtures:", checkError);
        } else {
          console.log("Fixture count in database:", count || 0);
        }
      } catch (err) {
        console.error("Exception checking fixture count:", err);
      }

      console.log(`Initial data fetch completed: ${successfulFixtureUpserts}/${fixtures.length} fixtures (${fixtureErrorCount} errors), ${successfulPlayerUpserts}/${playersData.length} players (${playerErrorCount} errors) saved to database`);
      return { 
        fixtures_count: fixtures.length, 
        players_count: playersData.length,
        fixtures_saved: successfulFixtureUpserts,
        players_saved: successfulPlayerUpserts,
        fixture_errors: fixtureErrorCount,
        player_errors: playerErrorCount
      };
    }

    // Function to fetch performance data for a specific fixture
    async function fetchFixturePerformances(fixture_id: string) {
      console.log(`Fetching performance data for fixture ${fixture_id}...`);
      
      // Fetch batting data
      const battingUrl = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixture_id}?include=batting&api_token=${API_TOKEN}`;
      const battingResponse = await fetch(battingUrl);
      const battingData = await battingResponse.json();
      
      let battingRecords = [];
      if (battingData.data?.batting) {
        battingRecords = battingData.data.batting;
      } else if (battingData.included) {
        battingRecords = battingData.included.filter((item: any) => 
          item.type?.toLowerCase() === 'batting'
        );
      }

      // Transform and store batting data
      const battingUpserts = battingRecords.map((record: any) => {
        const playerId = record.player_id || record.attributes?.player_id;
        const runsScored = record.score || record.attributes?.runs || 0;
        const ballsFaced = record.ball || record.attributes?.balls || 0;
        const fours = record.four_x || record.attributes?.fours || 0;
        const sixes = record.six_x || record.attributes?.sixes || 0;
        const strikeRate = ballsFaced > 0 ? (runsScored / ballsFaced) * 100 : 0;

        return supabase.from('batting_performances').upsert({
          fixture_id,
          player_id: playerId,
          runs_scored: runsScored,
          balls_faced: ballsFaced,
          boundaries: fours,
          sixes,
          strike_rate: strikeRate
        });
      });

      // Fetch bowling data
      const bowlingUrl = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixture_id}?include=bowling&api_token=${API_TOKEN}`;
      const bowlingResponse = await fetch(bowlingUrl);
      const bowlingData = await bowlingResponse.json();
      
      let bowlingRecords = [];
      if (bowlingData.data?.bowling) {
        bowlingRecords = bowlingData.data.bowling;
      } else if (bowlingData.included) {
        bowlingRecords = bowlingData.included.filter((item: any) => 
          item.type?.toLowerCase() === 'bowling'
        );
      }

      // Transform and store bowling data
      const bowlingUpserts = bowlingRecords.map((record: any) => {
        const playerId = record.player_id || record.attributes?.player_id;
        const oversBowled = record.overs || record.attributes?.overs || 0;
        const runsConceded = record.runs || record.attributes?.runs || 0;
        const wickets = record.wickets || record.attributes?.wickets || 0;
        const maidenOvers = record.medians || record.attributes?.maidens || 0;
        const economy = record.rate || record.attributes?.economy || 0;

        return supabase.from('bowling_performances').upsert({
          fixture_id,
          player_id: playerId,
          overs_bowled: oversBowled,
          runs_conceded: runsConceded,
          wickets,
          maiden_overs: maidenOvers,
          economy
        });
      });

      // Fetch ball-by-ball data for fielding performances
      const ballsUrl = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixture_id}?include=balls&api_token=${API_TOKEN}`;
      const ballsResponse = await fetch(ballsUrl);
      const ballsData = await ballsResponse.json();

      let balls = [];
      if (ballsData.data?.balls) {
        balls = Array.isArray(ballsData.data.balls) 
          ? ballsData.data.balls 
          : ballsData.data.balls.data || [];
      }

      // Process fielding performances
      const fieldingStats = new Map();

      const getFieldingStats = (playerId: string) => {
        if (!fieldingStats.has(playerId)) {
          fieldingStats.set(playerId, {
            fixture_id,
            player_id: playerId,
            lbw_bowled_wickets: 0,
            dot_balls: 0,
            catches: 0,
            stumpings: 0,
            direct_runouts: 0,
            indirect_runouts: 0
          });
        }
        return fieldingStats.get(playerId);
      };

      // Process each ball for fielding stats
      balls.forEach((ball: any) => {
        const scoreName = (ball.score?.name || "").toLowerCase().trim();
        const bowlerId = ball.bowler_id;
        const catchstumpId = ball.catchstump_id;
        const runoutById = ball.runout_by_id;

        if (["clean bowled", "lbw out"].includes(scoreName) && bowlerId) {
          const stats = getFieldingStats(bowlerId);
          stats.lbw_bowled_wickets++;
        }

        if (["no run", "catch out", "clean bowled", "lbw out", "hit wicket"].includes(scoreName) ||
            scoreName.includes("stump out") || scoreName.includes("bye")) {
          if (bowlerId) {
            const stats = getFieldingStats(bowlerId);
            stats.dot_balls++;
          }
        }

        if (scoreName === "catch out" && catchstumpId) {
          const stats = getFieldingStats(catchstumpId);
          stats.catches++;
        }

        if (scoreName.includes("stump out") && !scoreName.includes("sub") && catchstumpId) {
          const stats = getFieldingStats(catchstumpId);
          stats.stumpings++;
        }

        if (scoreName.includes("run out") && !scoreName.includes("sub")) {
          if (!catchstumpId && !runoutById) {
            if (runoutById) {
              const stats = getFieldingStats(runoutById);
              stats.direct_runouts++;
            } else if (catchstumpId) {
              const stats = getFieldingStats(catchstumpId);
              stats.direct_runouts++;
            }
          } else {
            if (runoutById) {
              const stats = getFieldingStats(runoutById);
              stats.indirect_runouts++;
            }
            if (catchstumpId) {
              const stats = getFieldingStats(catchstumpId);
              stats.indirect_runouts++;
            }
          }
        }
      });

      // Store fielding performances
      const fieldingUpserts = Array.from(fieldingStats.values()).map(stats => 
        supabase.from('fielding_performances').upsert(stats)
      );

      // Execute all database operations
      await Promise.all([
        ...battingUpserts,
        ...bowlingUpserts,
        ...fieldingUpserts
      ]);

      // Calculate and store fantasy scores
      await calculateFantasyPoints(fixture_id, supabase);
      
      console.log(`Performance data processed for fixture ${fixture_id}`);
      return { status: 'success', fixture_id };
    }

    // Function to calculate fantasy points
    async function calculateFantasyPoints(fixture_id: string, supabase: any) {
      const { data: battingPerfs } = await supabase
        .from('batting_performances')
        .select('*')
        .eq('fixture_id', fixture_id);

      const { data: bowlingPerfs } = await supabase
        .from('bowling_performances')
        .select('*')
        .eq('fixture_id', fixture_id);

      const { data: fieldingPerfs } = await supabase
        .from('fielding_performances')
        .select('*')
        .eq('fixture_id', fixture_id);

      // Get all unique player IDs
      const playerIds = new Set([
        ...(battingPerfs || []).map(p => p.player_id),
        ...(bowlingPerfs || []).map(p => p.player_id),
        ...(fieldingPerfs || []).map(p => p.player_id)
      ]);

      const fantasyScores = Array.from(playerIds).map(playerId => {
        const batting = battingPerfs?.find(p => p.player_id === playerId);
        const bowling = bowlingPerfs?.find(p => p.player_id === playerId);
        const fielding = fieldingPerfs?.find(p => p.player_id === playerId);

        // Calculate batting points
        let battingPoints = 0;
        if (batting) {
          battingPoints += batting.runs_scored;
          battingPoints += batting.boundaries * 4;
          battingPoints += batting.sixes * 6;

          // Bonus points for milestones
          if (batting.runs_scored >= 100) battingPoints += 16;
          else if (batting.runs_scored >= 75) battingPoints += 12;
          else if (batting.runs_scored >= 50) battingPoints += 8;
          else if (batting.runs_scored >= 25) battingPoints += 4;

          // Duck penalty
          if (batting.runs_scored === 0 && batting.balls_faced > 0) {
            battingPoints -= 2;
          }

          // Strike rate bonus/penalty
          if (batting.balls_faced >= 10) {
            const strikeRate = batting.strike_rate;
            if (strikeRate > 170) battingPoints += 6;
            else if (strikeRate > 150) battingPoints += 4;
            else if (strikeRate >= 130) battingPoints += 2;
            else if (strikeRate <= 70 && strikeRate > 60) battingPoints -= 2;
            else if (strikeRate <= 60 && strikeRate >= 50) battingPoints -= 4;
            else if (strikeRate < 50) battingPoints -= 6;
          }
        }

        // Calculate bowling points
        let bowlingPoints = 0;
        if (bowling) {
          bowlingPoints += bowling.wickets * 25;
          bowlingPoints += bowling.maiden_overs * 12;
          if (bowling.wickets === 3) bowlingPoints += 4;
          else if (bowling.wickets === 4) bowlingPoints += 8;
          else if (bowling.wickets >= 5) bowlingPoints += 12;

          // Economy rate bonus/penalty
          if (bowling.overs_bowled >= 2) {
            const economy = bowling.economy;
            if (economy < 5) bowlingPoints += 6;
            else if (economy >= 5 && economy <= 5.99) bowlingPoints += 4;
            else if (economy >= 6 && economy <= 7) bowlingPoints += 2;
            else if (economy >= 10 && economy <= 11) bowlingPoints -= 2;
            else if (economy > 11 && economy <= 12) bowlingPoints -= 4;
            else if (economy > 12) bowlingPoints -= 6;
          }
        }

        // Calculate fielding points
        let fieldingPoints = 0;
        if (fielding) {
          fieldingPoints += fielding.catches * 8;
          if (fielding.catches >= 3) fieldingPoints += 4;
          fieldingPoints += fielding.stumpings * 12;
          fieldingPoints += fielding.direct_runouts * 12;
          fieldingPoints += fielding.indirect_runouts * 6;
          fieldingPoints += fielding.dot_balls;
          fieldingPoints += fielding.lbw_bowled_wickets * 8;
        }

        // Add base points for playing
        const totalPoints = battingPoints + bowlingPoints + fieldingPoints + 4;

        return {
          fixture_id,
          player_id: playerId,
          batting_points: battingPoints,
          bowling_points: bowlingPoints,
          fielding_points: fieldingPoints,
          total_points: totalPoints
        };
      });

      // Store fantasy scores
      await Promise.all(
        fantasyScores.map(score =>
          supabase.from('fantasy_scores').upsert(score)
        )
      );
    }

    // Main function to check and update fixtures
    async function checkAndUpdateFixtures() {
      console.log("Checking fixtures for updates...");
      const now = new Date();
      
      // Get all fixtures
      const { data: fixtures, error } = await supabase
        .from('fixtures')
        .select('*');
      
      if (error) {
        throw new Error(`Error fetching fixtures: ${error.message}`);
      }
      
      console.log(`Retrieved ${fixtures?.length || 0} fixtures from database`);
      
      if (!fixtures || fixtures.length === 0) {
        console.log("No fixtures found in database. You may need to fetch initial data first.");
        return {
          total_fixtures: 0,
          completed_with_data: 0,
          live_updated: 0,
          past_matches_updated: 0
        };
      }
      
      // Count metrics for reporting
      let completed = 0;
      let liveUpdated = 0;
      let pastMatchesUpdated = 0;
      
      for (const fixture of fixtures) {
        const fixtureId = fixture.id;
        const startingAt = new Date(fixture.starting_at);
        const endTime = new Date(startingAt);
        endTime.setHours(endTime.getHours() + 4); // Assuming a match lasts about 4 hours
        
        // Check if match data exists
        const { data: battingData, error: battingError } = await supabase
          .from('batting_performances')
          .select('id')
          .eq('fixture_id', fixtureId)
          .limit(1);
          
        if (battingError) {
          console.error(`Error checking batting data for fixture ${fixtureId}:`, battingError);
          continue;
        }
        
        const hasMatchData = (battingData && battingData.length > 0);
        
        // Case 1: Match is currently live
        if (startingAt <= now && now <= endTime) {
          console.log(`Fixture ${fixtureId} is live, updating data...`);
          await fetchFixturePerformances(fixtureId.toString());
          liveUpdated++;
        }
        // Case 2: Match has already happened but we don't have data
        else if (endTime < now && !hasMatchData) {
          console.log(`Fixture ${fixtureId} is completed but missing data, fetching...`);
          await fetchFixturePerformances(fixtureId.toString());
          pastMatchesUpdated++;
        }
        // Case 3: Match is complete and we have data
        else if (endTime < now && hasMatchData) {
          completed++;
        }
      }
      
      console.log(`Update summary: ${completed} fixtures with data, ${liveUpdated} live updated, ${pastMatchesUpdated} past matches updated`);
      
      return {
        total_fixtures: fixtures.length,
        completed_with_data: completed,
        live_updated: liveUpdated,
        past_matches_updated: pastMatchesUpdated
      };
    }

    // Choose the operation based on the request
    const { action } = await req.json();
    let result;
    
    if (action === 'fetch-initial-data') {
      result = await fetchCricketData();
    } else if (action === 'check-and-update') {
      result = await checkAndUpdateFixtures();
    } else {
      // Default to checking and updating fixtures
      result = await checkAndUpdateFixtures();
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cricket data processing completed',
        result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
