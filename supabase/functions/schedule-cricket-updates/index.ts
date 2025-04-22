
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
    
    console.log("Directly configuring cron job via SQL query...");
    
    // Execute raw SQL to set up cron job directly instead of using the function
    const { data: directSqlResult, error: directSqlError } = await supabase.rpc(
      'setup_cricket_update_cron'
    );
    
    if (directSqlError) {
      console.error('Error setting up cron job via RPC:', directSqlError);
      
      // Try executing the SQL query directly to get a more detailed error
      const { error: rawSqlError } = await supabase.from('pg_extension').select('*');
      console.log('Test query result to check connection:', rawSqlError ? 'Error' : 'Success');
      
      throw new Error(`Failed to set up cron job: ${directSqlError.message}`);
    }

    console.log('Cron job setup successful:', directSqlResult);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cricket update scheduler configured successfully',
        data: directSqlResult
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
