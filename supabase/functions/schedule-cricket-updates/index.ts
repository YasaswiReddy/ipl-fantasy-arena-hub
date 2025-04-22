
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
    
    // First verify that the extensions are enabled
    console.log("Checking for required PostgreSQL extensions...");
    const { data: pgCronExt, error: pgCronError } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('name', 'pg_cron')
      .single();
    
    if (pgCronError) {
      console.error('Error checking pg_cron extension:', pgCronError);
      throw new Error(`pg_cron extension check failed: ${pgCronError.message}`);
    }
    
    if (!pgCronExt) {
      throw new Error('pg_cron extension is not enabled. Please enable it in your Supabase project settings.');
    }
    
    const { data: pgNetExt, error: pgNetError } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('name', 'pg_net')
      .single();
    
    if (pgNetError) {
      console.error('Error checking pg_net extension:', pgNetError);
      throw new Error(`pg_net extension check failed: ${pgNetError.message}`);
    }
    
    if (!pgNetExt) {
      throw new Error('pg_net extension is not enabled. Please enable it in your Supabase project settings.');
    }
    
    console.log("Required extensions are enabled, proceeding with scheduler setup...");
    
    // Execute raw SQL to set up cron job using the function
    console.log("Calling setup_cricket_update_cron function...");
    const { data: cronResult, error: cronError } = await supabase.rpc(
      'setup_cricket_update_cron'
    );
    
    if (cronError) {
      console.error('Error setting up cron job via RPC:', cronError);
      
      // Try to get more detailed error information
      console.log("Checking cron.job table for existing jobs...");
      const { data: cronJobs, error: cronJobsError } = await supabase.rpc(
        'query_pg_cron_jobs',
        {}
      );
      
      if (cronJobsError) {
        console.error('Error querying cron jobs:', cronJobsError);
      } else {
        console.log('Current cron jobs:', cronJobs);
      }
      
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
