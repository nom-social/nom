# Database Aggregation Optimization

## Problem Solved

The previous implementation was fetching **all** timeline likes records and then aggregating them in JavaScript:

```typescript
// INEFFICIENT: Fetching all individual like records
const { data: likeCounts } = await supabase
  .from("timeline_likes")
  .select("dedupe_hash")
  .in("dedupe_hash", dedupeHashes)
  .throwOnError();

// Aggregating in JavaScript
const likeCountMap = likeCounts?.reduce((acc, like) => {
  acc[like.dedupe_hash] = (acc[like.dedupe_hash] || 0) + 1;
  return acc;
}, {}) || {};
```

**Issues:**
- For popular posts with many likes, this could fetch thousands of records
- Network overhead transferring all individual records
- CPU overhead aggregating in JavaScript
- Inefficient as the dataset grows

## Solution: Database Aggregation

Created a PostgreSQL function that performs aggregation in the database:

### Migration Required

Run this migration to create the database function:

```sql
-- File: supabase/migrations/20250702000000_add_batch_likes_function.sql
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
```

### New Implementation

```typescript
// EFFICIENT: Database aggregation
const { data: likeData } = await (supabase as any)
  .rpc('get_batch_like_data', {
    dedupe_hashes: dedupeHashes,
    user_id_param: userId || null
  })
  .throwOnError();
```

## Performance Benefits

### Before (JavaScript Aggregation):
- **Query 1**: `SELECT dedupe_hash FROM timeline_likes WHERE dedupe_hash IN (...)`
  - Returns: **N records** (where N = total number of likes)
- **Query 2**: `SELECT dedupe_hash FROM timeline_likes WHERE dedupe_hash IN (...) AND user_id = ?`
  - Returns: **M records** (where M = user's likes)
- **Processing**: JavaScript aggregation of N + M records

### After (Database Aggregation):
- **Single Query**: `SELECT get_batch_like_data(array[...], ?)`
  - Returns: **10 records** (one per timeline item)
- **Processing**: Simple map creation from pre-aggregated results

### Example Impact:
For a page with 10 timeline items where each has 100 likes:
- **Before**: Fetch 1,000+ individual records, aggregate in JavaScript
- **After**: Fetch 10 pre-aggregated records from database
- **Improvement**: ~99% reduction in data transfer and processing

## Database Function Explanation

The function uses efficient SQL patterns:

1. **`like_counts` CTE**: Uses `COUNT(*)` with `GROUP BY` to aggregate likes per dedupe_hash
2. **`user_likes` CTE**: Efficiently finds user's liked posts
3. **`all_hashes` CTE**: Ensures all requested hashes are returned (even with 0 likes)
4. **LEFT JOINs**: Combines results to return complete data set

## Migration Instructions

1. Run the migration:
   ```bash
   supabase db reset  # if in development
   # OR
   supabase migration up  # if in production
   ```

2. The function will be available immediately
3. TypeScript types use `(supabase as any)` temporarily until types are regenerated

## Files Modified

- `src/app/page/feed/actions.ts` - Updated `batchFetchLikeData`
- `src/app/[org]/[repo]/page/feed/actions.ts` - Updated `batchFetchLikeData`  
- `src/app/[org]/[repo]/status/[status]/page/actions.ts` - Updated `fetchLikeData`
- `supabase/migrations/20250702000000_add_batch_likes_function.sql` - New migration

## Monitoring

Monitor the function performance:
```sql
-- Check function performance
SELECT schemaname, funcname, calls, total_time, mean_time 
FROM pg_stat_user_functions 
WHERE funcname = 'get_batch_like_data';
```