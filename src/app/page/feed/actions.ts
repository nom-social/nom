import { Tables } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

export type FeedItem = Tables<"user_timeline"> & {
  repositories: {
    org: string;
    repo: string;
  };
};

export type FeedItemWithLikes = FeedItem & {
  likeCount: number;
  isLiked: boolean;
};

export type PublicFeedItem = Tables<"public_timeline"> & {
  repositories: {
    org: string;
    repo: string;
  };
};

export type PublicFeedItemWithLikes = PublicFeedItem & {
  likeCount: number;
  isLiked: boolean;
};

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

// Helper function to batch fetch like data for multiple items
async function batchFetchLikeData(supabase: ReturnType<typeof createClient>, dedupeHashes: string[], userId?: string) {
  if (dedupeHashes.length === 0) {
    return { likeCountMap: {}, userLikesMap: {} };
  }

  // Query 1: Get aggregated like counts per dedupe_hash
  const { data: likeCountsData } = await supabase
    .from("timeline_likes")
    .select("dedupe_hash")
    .in("dedupe_hash", dedupeHashes)
    .throwOnError();

  // Count likes per dedupe_hash
  const likeCountMap: Record<string, number> = {};
  likeCountsData?.forEach((like: { dedupe_hash: string }) => {
    likeCountMap[like.dedupe_hash] = (likeCountMap[like.dedupe_hash] || 0) + 1;
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

export async function fetchFeed({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<{ items: FeedItemWithLikes[]; hasMore: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new NotAuthenticatedError();

  const { data } = await supabase
    .from("user_timeline")
    .select("*, repositories ( org, repo )")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data || [];
  
  // Batch fetch like data for all items
  const dedupeHashes = items.map((item) => item.dedupe_hash);
  const { likeCountMap, userLikesMap } = await batchFetchLikeData(supabase, dedupeHashes, user.id);

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

fetchFeed.key = "src/app/page/feed/actions/fetchFeed";

export async function fetchPublicFeed({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<{ items: PublicFeedItemWithLikes[]; hasMore: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("public_timeline")
    .select("*, repositories ( org, repo )")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data || [];
  
  // Batch fetch like data for all items
  const dedupeHashes = items.map((item) => item.dedupe_hash);
  const { likeCountMap, userLikesMap } = await batchFetchLikeData(supabase, dedupeHashes, user?.id);

  // Enhance items with like data
  const itemsWithLikes: PublicFeedItemWithLikes[] = items.map((item) => ({
    ...item,
    likeCount: likeCountMap[item.dedupe_hash] || 0,
    isLiked: userLikesMap[item.dedupe_hash] || false,
  }));

  // If we got less than limit, there are no more items
  const hasMore = items.length === limit;

  return { items: itemsWithLikes, hasMore };
}

fetchPublicFeed.key = "src/app/page/feed/actions/fetchPublicFeed";
