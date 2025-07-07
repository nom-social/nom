import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FeedItemWithLikes = FeedItem & {
  likeCount: number;
  isLiked: boolean;
};

export type FetchFeedPageParams = {
  repoId: string;
  limit: number;
  offset: number;
};

export type FetchFeedPageResult = {
  items: FeedItemWithLikes[];
  hasMore: boolean;
};

// Helper function to batch fetch like data for multiple items
async function batchFetchLikeData(supabase: ReturnType<typeof createClient>, dedupeHashes: string[], userId?: string) {
  if (dedupeHashes.length === 0) {
    return { likeCountMap: {}, userLikesMap: {} };
  }

  // Query 1: Get aggregated like counts per dedupe_hash using GROUP BY
  const { data: likeCountsData } = await supabase
    .from("timeline_likes")
    .select("dedupe_hash, count()")
    .in("dedupe_hash", dedupeHashes)
    .throwOnError();

  // Convert aggregated results to map
  const likeCountMap: Record<string, number> = {};
  likeCountsData?.forEach((item: { dedupe_hash: string; count: number }) => {
    likeCountMap[item.dedupe_hash] = item.count;
  });

  // Query 2: Get user's liked posts (only if user is authenticated)
  let userLikesMap: Record<string, boolean> = {};
  if (userId) {
    const { data: userLikesData } = await supabase
      .from("timeline_likes")
      .select("dedupe_hash")
      .in("dedupe_hash", dedupeHashes)
      .eq("user_id", userId)
      .throwOnError();

    userLikesData?.forEach((like: { dedupe_hash: string }) => {
      userLikesMap[like.dedupe_hash] = true;
    });
  }

  // Ensure all dedupe_hashes have entries (even if 0 likes)
  dedupeHashes.forEach((hash) => {
    if (!(hash in likeCountMap)) {
      likeCountMap[hash] = 0;
    }
    if (!(hash in userLikesMap)) {
      userLikesMap[hash] = false;
    }
  });

  return { likeCountMap, userLikesMap };
}

export async function fetchFeedPage({
  repoId,
  limit,
  offset,
}: FetchFeedPageParams): Promise<FetchFeedPageResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("public_timeline")
    .select("*")
    .eq("repo_id", repoId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data || [];
  
  // Batch fetch like data for all items
  const dedupeHashes = items.map((item) => item.dedupe_hash);
  const { likeCountMap, userLikesMap } = await batchFetchLikeData(supabase, dedupeHashes, user?.id);

  // Enhance items with like data
  const itemsWithLikes: FeedItemWithLikes[] = items.map((item) => ({
    ...item,
    likeCount: likeCountMap[item.dedupe_hash] || 0,
    isLiked: userLikesMap[item.dedupe_hash] || false,
  }));

  // If we got less than limit, there are no more items
  const hasMore = items.length === limit;

  return { items: itemsWithLikes, hasMore };
}

fetchFeedPage.key = "src/app/[org]/[repo]/page/feed/actions/fetchFeedPage";
