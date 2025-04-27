-- Function to calculate player rankings based on fantasy scores
CREATE OR REPLACE FUNCTION public.get_player_rankings()
RETURNS TABLE (
  player_id INTEGER,
  player_name TEXT,
  total_points NUMERIC,
  average_points NUMERIC,
  matches_played INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH player_scores AS (
    SELECT 
      fs.player_id,
      p.name as player_name,
      SUM(fs.total_points) as total_points,
      COUNT(DISTINCT fs.fixture_id) as matches_played
    FROM fantasy_scores fs
    JOIN players p ON fs.player_id = p.id
    GROUP BY fs.player_id, p.name
  )
  
  SELECT 
    ps.player_id,
    ps.player_name,
    ps.total_points,
    CASE 
      WHEN ps.matches_played > 0 THEN ps.total_points / ps.matches_played 
      ELSE 0 
    END as average_points,
    ps.matches_played
  FROM player_scores ps
  WHERE ps.matches_played > 0  -- Only include players who have played matches
  ORDER BY ps.total_points DESC;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_player_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_rankings() TO anon;