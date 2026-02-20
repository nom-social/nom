import { createClient } from "@/utils/supabase/server";

import type { FetchFeedPageResult } from "./actions";

export async function fetchFeedPageServer({
  repoId,
  limit,
  offset,
  query,
}: {
  repoId: string;
  limit: number;
  offset: number;
  query?: string;
}): Promise<FetchFeedPageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*")
    .eq("repo_id", repoId);

  if (query?.trim()) {
    const tsquery = query
      .trim()
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => word.length > 0)
      .join(" & ");

    if (tsquery) {
      queryBuilder = queryBuilder.textSearch("search_vector", tsquery);
    }
  }

  const { data } = await queryBuilder
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data || [];
  const dedupeHashes = items.map((item) => item.dedupe_hash);

  const { data: likeData } = await supabase
    .rpc("get_batch_like_data", {
      dedupe_hashes: dedupeHashes,
      user_id_param: user?.id,
    })
    .throwOnError();

  const likeCountMap: Record<string, number> = {};
  const userLikesMap: Record<string, boolean> = {};
  likeData.forEach(
    (row: { dedupe_hash: string; like_count: number; user_liked: boolean }) => {
      likeCountMap[row.dedupe_hash] = row.like_count;
      userLikesMap[row.dedupe_hash] = row.user_liked;
    }
  );

  const itemsWithLikes = items.map((item) => ({
    ...item,
    likeCount: likeCountMap[item.dedupe_hash] || 0,
    isLiked: userLikesMap[item.dedupe_hash] || false,
  }));

  return {
    items: itemsWithLikes,
    hasMore: items.length === limit,
  };
}
