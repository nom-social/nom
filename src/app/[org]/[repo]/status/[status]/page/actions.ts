import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FeedItemWithLikes = FeedItem & {
  likeCount: number;
  isLiked: boolean;
};

export type FetchFeedItemParams = {
  statusId: string;
  repo: string;
  org: string;
};

// Helper function to fetch like data for a single item
async function fetchLikeData(supabase: ReturnType<typeof createClient>, dedupeHash: string, userId?: string) {
  // Query 1: Get like count for the item using count
  const { count: likeCount } = await supabase
    .from("timeline_likes")
    .select("*", { count: "exact", head: true })
    .eq("dedupe_hash", dedupeHash)
    .throwOnError();

  // Query 2: Check if user liked this item (only if authenticated)
  let isLiked = false;
  if (userId) {
    const { data: userLike } = await supabase
      .from("timeline_likes")
      .select("id")
      .eq("dedupe_hash", dedupeHash)
      .eq("user_id", userId)
      .maybeSingle()
      .throwOnError();

    isLiked = !!userLike;
  }

  return {
    likeCount: likeCount || 0,
    isLiked,
  };
}

export async function fetchFeedItem({
  statusId,
  repo,
  org,
}: FetchFeedItemParams): Promise<FeedItemWithLikes | null> {
  const supabase = createClient(cookies());

  const { data: repoData } = await supabase
    .from("repositories")
    .select("*")
    .eq("repo", repo)
    .eq("org", org)
    .single();

  if (!repoData) return null;

  const { data } = await supabase
    .from("public_timeline")
    .select("*")
    .eq("dedupe_hash", statusId)
    .eq("repo_id", repoData.id)
    .single();

  if (!data) return null;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch like data for the item
  const { likeCount, isLiked } = await fetchLikeData(supabase, data.dedupe_hash, user?.id);

  return {
    ...data,
    likeCount,
    isLiked,
  };
}
