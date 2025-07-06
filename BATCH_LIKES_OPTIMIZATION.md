# Batch Likes Optimization

## Problem

The timeline feeds were inefficient because each `ActivityCard` component was making individual database queries to fetch like data:
- `isLiked(dedupe_hash)` - to check if the current user liked the item
- `getLikeCount(dedupe_hash)` - to get the total like count for the item

With 10 items per page, this resulted in 20 database queries per page load, which was very inefficient.

## Solution

Implemented batch loading of like data at the action function level:

### Changes Made

1. **Modified Action Functions**:
   - `fetchFeed` in `src/app/page/feed/actions.ts` - for user timeline
   - `fetchPublicFeed` in `src/app/page/feed/actions.ts` - for public timeline  
   - `fetchFeedPage` in `src/app/[org]/[repo]/page/feed/actions.ts` - for repo-specific timeline
   - `fetchFeedItem` in `src/app/[org]/[repo]/status/[status]/page/actions.ts` - for individual status items

2. **Added Batch Like Data Helper Function**:
   - `batchFetchLikeData()` - fetches like counts and user's liked status for multiple items in 1-2 queries
   - Single query for like counts using `COUNT()` aggregation
   - Optional second query for user's liked status (only if authenticated)

3. **Updated ActivityCard Component**:
   - Removed individual `useQuery` calls for `isLiked` and `getLikeCount`
   - Added `initialLikeCount` and `initialIsLiked` props
   - Uses local state with optimistic updates for like/unlike actions

4. **Updated Feed Components**:
   - `FeedPrivate`, `FeedPublic`, and repo-specific `Feed` components
   - Pass pre-fetched like data to `ActivityCard` components

### Performance Impact

- **Before**: 20 database queries per 10 items (2 queries per card)
- **After**: 2 database queries per 10 items (1 for counts, 1 for user status)
- **Improvement**: 90% reduction in database queries

### Database Query Pattern

**Before:**
```sql
-- For each item (10x):
SELECT * FROM timeline_likes WHERE dedupe_hash = ? AND user_id = ?;
SELECT COUNT(*) FROM timeline_likes WHERE dedupe_hash = ?;
```

**After:**
```sql
-- Single batch query for all items:
SELECT dedupe_hash FROM timeline_likes WHERE dedupe_hash IN (?, ?, ?, ...);
SELECT dedupe_hash FROM timeline_likes WHERE dedupe_hash IN (?, ?, ?, ...) AND user_id = ?;
```

### Benefits

1. **Reduced Database Load**: 90% fewer queries to the database
2. **Faster Page Load**: Batch queries are more efficient than individual queries
3. **Better User Experience**: Faster timeline rendering
4. **Scalability**: Performance improvement scales with the number of items per page

## Files Modified

- `src/app/page/feed/actions.ts`
- `src/app/[org]/[repo]/page/feed/actions.ts`
- `src/app/[org]/[repo]/status/[status]/page/actions.ts`
- `src/components/shared/activity-card.tsx`
- `src/app/page/feed/feed-private.tsx`
- `src/app/page/feed/feed-public.tsx`
- `src/app/[org]/[repo]/page/feed.tsx`
- `src/app/[org]/[repo]/status/[status]/page.tsx`