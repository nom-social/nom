import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FetchFeedPageParams = {
  repoId: string;
  limit: number;
  cursor?: string; // ISO string for created_at
};

export type FetchFeedPageResult = {
  items: FeedItem[];
  nextCursor?: string;
};

export async function fetchFeedPage({
  repoId,
  limit,
  cursor,
}: FetchFeedPageParams): Promise<FetchFeedPageResult> {
  const supabase = createClient();

  let query = supabase
    .from("public_timeline")
    .select("*")
    .eq("repo_id", repoId)
    .order("updated_at", { ascending: false })
    .limit(limit + 1); // Fetch one extra to check for next page

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const items = data || [];
  let nextCursor: string | undefined = undefined;

  if (items.length > limit) {
    const paginatedItems = items.slice(0, limit);
    nextCursor = items[limit]?.updated_at;
    return { items: paginatedItems, nextCursor };
  }

  return { items, nextCursor };
}
