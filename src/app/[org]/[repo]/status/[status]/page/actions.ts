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

// Helper function to batch fetch like data for a single item
async function fetchLikeData(supabase: ReturnType<typeof createClient>, dedupeHash: string, userId?: string) {
  // Use database function to efficiently get like count and user like status
  const { data: likeData } = await (supabase as any)
    .rpc('get_batch_like_data', {
      dedupe_hashes: [dedupeHash],
      user_id_param: userId || null
    })
    .throwOnError();

  const result = (likeData as Array<{ dedupe_hash: string; like_count: number; user_liked: boolean }> | null)?.[0];
  return {
    likeCount: result?.like_count || 0,
    isLiked: result?.user_liked || false,
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
