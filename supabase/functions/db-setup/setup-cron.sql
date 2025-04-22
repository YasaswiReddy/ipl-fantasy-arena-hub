
-- Enable the required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to setup the cron job
CREATE OR REPLACE FUNCTION public.setup_cricket_update_cron()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cron_job_name TEXT := 'cricket_update_every_5_minutes';
  function_url TEXT := 'https://zdpwgoiisigyuiudlbzz.supabase.co/functions/v1/auto-fetch-cricket-data';
  supabase_key TEXT := current_setting('request.headers')::json->>'apikey';
  result json;
BEGIN
  -- First, try to remove the job if it exists
  PERFORM cron.unschedule(cron_job_name);
  
  -- Create a new cron job that runs every 5 minutes
  SELECT cron.schedule(
    cron_job_name,
    '*/5 * * * *', -- Run every 5 minutes
    $$
    SELECT
      net.http_post(
        url:='https://zdpwgoiisigyuiudlbzz.supabase.co/functions/v1/auto-fetch-cricket-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcHdnb2lpc2lneXVpdWRsYnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIyOTUsImV4cCI6MjA2MDcyODI5NX0.rf2iB5zO2qR_7cus3WveyqcF-_eVG_4_MLzIB-V89oY"}'::jsonb,
        body:='{"action": "check-and-update"}'::jsonb
      ) as request_id;
    $$
  ) INTO result;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Cricket update cron job scheduled successfully',
    'cron_job', cron_job_name,
    'schedule', '*/5 * * * *',
    'result', result
  );
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.setup_cricket_update_cron() TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_cricket_update_cron() TO anon;
