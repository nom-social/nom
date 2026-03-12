import { parseSearchFilters } from "@/lib/feed-utils";
import { createClient } from "@/utils/supabase/server";

import type { PublicFeedItemWithLikes } from "./actions";

export async function fetchPublicFeedServer({
  limit,
  offset,
  query,
}: {
  limit: number;
  offset: number;
  query?: string;
}): Promise<{ items: PublicFeedItemWithLikes[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filters = parseSearchFilters(query);

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, repositories!inner ( org, repo )");

  if (filters.org || filters.owner) {
    queryBuilder = queryBuilder.eq(
      "repositories.org",
      filters.org || filters.owner || "",
    );
  }
  if (filters.repo) {
    queryBuilder = queryBuilder.eq("repositories.repo", filters.repo);
  }
  if (filters.type) {
    queryBuilder = queryBuilder.eq("type", filters.type);
  }
  if (filters.from) {
    queryBuilder = queryBuilder.gte(
      "updated_at",
      new Date(filters.from).toISOString(),
    );
  }
  if (filters.to) {
    queryBuilder = queryBuilder.lte(
      "updated_at",
      new Date(filters.to).toISOString(),
    );
  }
  if (filters.textQuery?.trim()) {
    queryBuilder = queryBuilder.textSearch(
      "search_vector",
      filters.textQuery.trim(),
      { type: "websearch", config: "english" },
    );
  }
  if (filters.memes) {
    queryBuilder = queryBuilder.like("search_text", "%![%");
    if (filters.memes !== "all") {
      const terms = filters.memes.split(",").filter(Boolean);
      for (const term of terms) {
        queryBuilder = queryBuilder.ilike("search_text", `%${term}%`);
      }
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
    },
  );

  const itemsWithLikes: PublicFeedItemWithLikes[] = items.map((item) => ({
    ...item,
    likeCount: likeCountMap[item.dedupe_hash] || 0,
    isLiked: userLikesMap[item.dedupe_hash] || false,
  }));

  return {
    items: itemsWithLikes,
    hasMore: items.length === limit,
  };
}
