import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FetchFeedPageParams = {
  repoId: string;
  limit: number;
  offset: number;
};

export type FetchFeedPageResult = {
  items: FeedItem[];
  hasMore: boolean;
};

export async function fetchFeedPage({
  repoId,
  limit,
  offset,
}: FetchFeedPageParams): Promise<FetchFeedPageResult> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("public_timeline")
    .select("*")
    .eq("repo_id", repoId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const items = data || [];
  // If we got less than limit, there are no more items
  const hasMore = items.length === limit;

  return { items, hasMore };
}
