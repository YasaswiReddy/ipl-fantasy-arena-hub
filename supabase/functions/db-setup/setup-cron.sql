
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
  supabase_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcHdnb2lpc2lneXVpdWRsYnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIyOTUsImV4cCI6MjA2MDcyODI5NX0.rf2iB5zO2qR_7cus3WveyqcF-_eVG_4_MLzIB-V89oY';
  result json;
BEGIN
  -- First, try to remove the job if it exists
  BEGIN
    PERFORM cron.unschedule(cron_job_name);
    EXCEPTION WHEN OTHERS THEN
      -- If job doesn't exist yet, that's okay
      NULL;
  END;
  
  -- Create a new cron job that runs every 5 minutes
  -- Use direct SQL command to avoid quoting issues
  PERFORM cron.schedule(
    cron_job_name,
    '*/5 * * * *', -- Run every 5 minutes
    format('SELECT net.http_post(
      url:=''%s'',
      headers:=''{"Content-Type": "application/json", "Authorization": "Bearer %s"}''::jsonb,
      body:=''{"action": "check-and-update"}''::jsonb
    ) as request_id;',
    function_url, supabase_key)
  );
  
  -- Verify job was created
  SELECT row_to_json(job_row) INTO result
  FROM (
    SELECT * FROM cron.job WHERE jobname = cron_job_name
  ) job_row;
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Failed to create cron job. Job was not found after scheduling.';
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Cricket update cron job scheduled successfully',
    'cron_job', cron_job_name,
    'schedule', '*/5 * * * *',
    'job_details', result
  );
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.setup_cricket_update_cron() TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_cricket_update_cron() TO anon;
