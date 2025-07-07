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
  // Batch fetch like counts for all items
  const { data: likeCounts } = await supabase
    .from("timeline_likes")
    .select("dedupe_hash")
    .in("dedupe_hash", dedupeHashes)
    .throwOnError();

  // Count likes per dedupe_hash
  const likeCountMap = likeCounts?.reduce((acc: Record<string, number>, like: { dedupe_hash: string }) => {
    acc[like.dedupe_hash] = (acc[like.dedupe_hash] || 0) + 1;
    return acc;
  }, {}) || {};

  // Batch fetch user's liked status if authenticated
  let userLikesMap: Record<string, boolean> = {};
  if (userId) {
    const { data: userLikes } = await supabase
      .from("timeline_likes")
      .select("dedupe_hash")
      .eq("user_id", userId)
      .in("dedupe_hash", dedupeHashes)
      .throwOnError();

    userLikesMap = userLikes?.reduce((acc: Record<string, boolean>, like: { dedupe_hash: string }) => {
      acc[like.dedupe_hash] = true;
      return acc;
    }, {}) || {};
  }

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
