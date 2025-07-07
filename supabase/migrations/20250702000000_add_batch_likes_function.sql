-- Create a function to efficiently batch fetch like counts and user likes
CREATE OR REPLACE FUNCTION get_batch_like_data(
  dedupe_hashes text[],
  user_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  dedupe_hash text,
  like_count bigint,
  user_liked boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH like_counts AS (
    SELECT 
      tl.dedupe_hash,
      COUNT(*) as like_count
    FROM timeline_likes tl
    WHERE tl.dedupe_hash = ANY(dedupe_hashes)
    GROUP BY tl.dedupe_hash
  ),
  user_likes AS (
    SELECT 
      tl.dedupe_hash,
      true as user_liked
    FROM timeline_likes tl
    WHERE tl.dedupe_hash = ANY(dedupe_hashes)
      AND tl.user_id = user_id_param
      AND user_id_param IS NOT NULL
  ),
  all_hashes AS (
    SELECT unnest(dedupe_hashes) as dedupe_hash
  )
  SELECT 
    ah.dedupe_hash,
    COALESCE(lc.like_count, 0) as like_count,
    COALESCE(ul.user_liked, false) as user_liked
  FROM all_hashes ah
  LEFT JOIN like_counts lc ON ah.dedupe_hash = lc.dedupe_hash
  LEFT JOIN user_likes ul ON ah.dedupe_hash = ul.dedupe_hash
  ORDER BY ah.dedupe_hash;
END;
$$;