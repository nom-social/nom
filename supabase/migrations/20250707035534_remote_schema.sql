set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_batch_like_data(dedupe_hashes text[], user_id_param uuid DEFAULT NULL::uuid)
 RETURNS TABLE(dedupe_hash text, like_count bigint, user_liked boolean)
 LANGUAGE sql
AS $function$
  SELECT
    ah.dedupe_hash,
    COUNT(tl.*)                                   AS like_count,
    BOOL_OR(tl.user_id = user_id_param)           AS user_liked
  FROM unnest(dedupe_hashes) AS ah(dedupe_hash)
  LEFT JOIN timeline_likes tl
    ON tl.dedupe_hash = ah.dedupe_hash
  GROUP BY ah.dedupe_hash
  ORDER BY ah.dedupe_hash;
$function$
;


