
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
    
    // Check if pg_cron extension is enabled
    const { data: extensions, error: extensionsError } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('name', 'pg_cron');
    
    if (extensionsError) {
      console.error('Error checking pg_cron extension:', extensionsError);
      throw new Error(`Failed to check pg_cron extension: ${extensionsError.message}`);
    }
    
    if (!extensions || extensions.length === 0) {
      throw new Error('pg_cron extension is not enabled. Please enable it in your Supabase project settings.');
    }
    
    console.log("pg_cron extension is enabled, proceeding with scheduler setup");
    
    // Directly run SQL to create or update the cron job
    const { data: cronResult, error: cronError } = await supabase.rpc(
      'setup_cricket_update_cron'
    );
    
    if (cronError) {
      console.error('Error setting up cron job:', cronError);
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
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
