
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting cricket update scheduler setup...");
    
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if the required extensions are enabled using SQL query
    console.log("Checking for required PostgreSQL extensions...");
    const { data: extData, error: extError } = await supabase.rpc(
      'query_pg_cron_jobs',
      {}
    );
    
    if (extError && extError.message.includes('function "query_pg_cron_jobs" does not exist')) {
      console.error('Error checking extensions: query_pg_cron_jobs function not found');
      throw new Error('The database function for querying cron jobs is not available. Please ensure all SQL migrations have been applied.');
    }
    
    // Execute raw SQL to set up cron job using the function
    console.log("Calling setup_cricket_update_cron function...");
    const { data: cronResult, error: cronError } = await supabase.rpc(
      'setup_cricket_update_cron'
    );
    
    if (cronError) {
      console.error('Error setting up cron job via RPC:', cronError);
      
      // Try to get detailed error information
      console.log("Attempting to get more detailed information...");
      
      throw new Error(`Failed to set up cron job: ${cronError.message}`);
    }

    console.log('Cron job setup successful:', cronResult);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cricket update scheduler configured successfully',
        data: cronResult
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
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
