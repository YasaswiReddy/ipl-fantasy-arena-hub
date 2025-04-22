
-- Function to safely query cron jobs
CREATE OR REPLACE FUNCTION public.query_pg_cron_jobs()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(job_row)) INTO result
  FROM (
    SELECT * FROM cron.job
  ) job_row;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.query_pg_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.query_pg_cron_jobs() TO anon;
