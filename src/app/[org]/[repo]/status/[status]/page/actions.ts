import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FetchFeedItemParams = {
  statusId: string;
  repo: string;
  org: string;
};

// Helper function to batch fetch like data for a single item
async function fetchLikeData(supabase: ReturnType<typeof createClient>, dedupeHash: string, userId?: string) {
  // Fetch like count for the item
  const { data: likeCounts } = await supabase
    .from("timeline_likes")
    .select("dedupe_hash")
    .eq("dedupe_hash", dedupeHash)
    .throwOnError();

  const likeCount = likeCounts?.length || 0;

  // Fetch user's liked status if authenticated
  let isLiked = false;
  if (userId) {
    const { data: userLike } = await supabase
      .from("timeline_likes")
      .select("dedupe_hash")
      .eq("user_id", userId)
      .eq("dedupe_hash", dedupeHash)
      .maybeSingle()
      .throwOnError();

    isLiked = !!userLike;
  }

  return { likeCount, isLiked };
}

export async function fetchFeedItem({
  statusId,
  repo,
  org,
}: FetchFeedItemParams): Promise<(FeedItem & { likeCount: number; isLiked: boolean }) | null> {
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
