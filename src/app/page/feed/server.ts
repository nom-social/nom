import { createClient } from "@/utils/supabase/server";
import {
  fetchOwnedRepoIds,
  toPostgrestInList,
} from "@/lib/repository-visibility";

import type { PublicFeedItemWithLikes } from "./actions";

// Types for parsed search filters
interface SearchFilters {
  org?: string;
  repo?: string;
  type?: string;
  from?: string;
  to?: string;
  textQuery: string;
  owner?: string;
}

function parseSearchFilters(query?: string): SearchFilters {
  if (!query || !query.trim()) {
    return { textQuery: "" };
  }

  const filters: SearchFilters = { textQuery: "" };
  let remainingText = query;

  const filterPatterns = {
    org: /\borg:(\S+)/g,
    repo: /\brepo:(\S+)/g,
    type: /\btype:(\S+)/g,
    from: /\bfrom:(\S+)/g,
    to: /\bto:(\S+)/g,
    owner: /\bowner:(\S+)/g,
  };

  Object.entries(filterPatterns).forEach(([key, pattern]) => {
    const matches = [...remainingText.matchAll(pattern)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      filters[key as keyof SearchFilters] = lastMatch[1];
      remainingText = remainingText.replace(pattern, "");
    }
  });

  filters.textQuery = remainingText.replace(/\s+/g, " ").trim();
  return filters;
}

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
  const ownedRepoIds = await fetchOwnedRepoIds(supabase, user?.id);

  const filters = parseSearchFilters(query);

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, repositories!inner ( org, repo, is_private )");

  if (ownedRepoIds.length > 0) {
    queryBuilder = queryBuilder.or(
      `repositories.is_private.eq.false,repo_id.in.(${toPostgrestInList(ownedRepoIds)})`
    );
  } else {
    queryBuilder = queryBuilder.eq("repositories.is_private", false);
  }

  if (filters.org || filters.owner) {
    queryBuilder = queryBuilder.eq(
      "repositories.org",
      filters.org || filters.owner || ""
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
      new Date(filters.from).toISOString()
    );
  }
  if (filters.to) {
    queryBuilder = queryBuilder.lte(
      "updated_at",
      new Date(filters.to).toISOString()
    );
  }
  if (filters.textQuery?.trim()) {
    queryBuilder = queryBuilder.textSearch(
      "search_vector",
      filters.textQuery.trim(),
      { type: "websearch", config: "english" }
    );
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
