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
async function batchFetchLikeData(
  supabase: ReturnType<typeof createClient>,
  dedupeHashes: string[],
  userId?: string
) {
  // Use database function to efficiently aggregate like counts and user likes
  const { data: likeData } = await supabase
    .rpc("get_batch_like_data", {
      dedupe_hashes: dedupeHashes,
      user_id_param: userId,
    })
    .throwOnError();

  // Convert the result to maps for easy lookup
  const likeCountMap: Record<string, number> = {};
  const userLikesMap: Record<string, boolean> = {};

  likeData.forEach((row) => {
    likeCountMap[row.dedupe_hash] = row.like_count;
    userLikesMap[row.dedupe_hash] = row.user_liked;
  });

  return { likeCountMap, userLikesMap };
}

export async function fetchFeed({
  limit,
  offset,
  query,
}: {
  limit: number;
  offset: number;
  query?: string;
}): Promise<{ items: FeedItemWithLikes[]; hasMore: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new NotAuthenticatedError();

  let queryBuilder = supabase
    .from("user_timeline")
    .select("*, repositories ( org, repo )")
    .eq("user_id", user.id);

  if (query && query.trim()) {
    const tsquery = query
      .trim()
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => word.length > 0)
      .join(" & ");

    if (!tsquery) {
      return { items: [], hasMore: false };
    }

    queryBuilder = queryBuilder.textSearch("search_vector", tsquery);
  }

  const { data } = await queryBuilder
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data || [];

  // Batch fetch like data for all items
  const dedupeHashes = items.map((item) => item.dedupe_hash);
  const { likeCountMap, userLikesMap } = await batchFetchLikeData(
    supabase,
    dedupeHashes,
    user.id
  );

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
  query,
}: {
  limit: number;
  offset: number;
  query?: string;
}): Promise<{ items: PublicFeedItemWithLikes[]; hasMore: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, repositories ( org, repo )");

  if (query && query.trim()) {
    const tsquery = query
      .trim()
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => word.length > 0)
      .join(" & ");

    if (!tsquery) {
      return { items: [], hasMore: false };
    }

    queryBuilder = queryBuilder.textSearch("search_vector", tsquery);
  }

  const { data } = await queryBuilder
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data || [];

  // Batch fetch like data for all items
  const dedupeHashes = items.map((item) => item.dedupe_hash);
  const { likeCountMap, userLikesMap } = await batchFetchLikeData(
    supabase,
    dedupeHashes,
    user?.id
  );

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
