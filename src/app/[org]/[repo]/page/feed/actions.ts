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
  query?: string;
};

export type FetchFeedPageResult = {
  items: FeedItemWithLikes[];
  hasMore: boolean;
};

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

export async function fetchFeedPage({
  repoId,
  limit,
  offset,
  query,
}: FetchFeedPageParams): Promise<FetchFeedPageResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*")
    .eq("repo_id", repoId);

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

  const itemsWithLikes: FeedItemWithLikes[] = items.map((item) => ({
    ...item,
    likeCount: likeCountMap[item.dedupe_hash] || 0,
    isLiked: userLikesMap[item.dedupe_hash] || false,
  }));

  const hasMore = items.length === limit;

  return { items: itemsWithLikes, hasMore };
}

fetchFeedPage.key = "src/app/[org]/[repo]/page/feed/actions/fetchFeedPage";
