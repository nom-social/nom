import { escapeForIlike } from "@/lib/repo-utils";
import { canUserAccessRepo } from "@/lib/repository-visibility";
import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FeedItemWithLikes = FeedItem & {
  likeCount: number;
  isLiked: boolean;
  isPrivate: boolean;
};

export type FetchFeedItemParams = {
  statusId: string;
  repo: string;
  org: string;
};

// Helper function to batch fetch like data for a single item
async function fetchLikeData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dedupeHash: string,
  userId?: string
) {
  // Use database function to efficiently get like count and user like status
  const { data: likeData } = await supabase
    .rpc("get_batch_like_data", {
      dedupe_hashes: [dedupeHash],
      user_id_param: userId,
    })
    .throwOnError();

  const result = likeData[0];
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: repoData } = await supabase
    .from("repositories")
    .select("id, is_private")
    .ilike("repo", escapeForIlike(repo))
    .ilike("org", escapeForIlike(org))
    .single();

  if (!repoData) return null;

  const hasAccess = await canUserAccessRepo(supabase, repoData, user?.id);
  if (!hasAccess) return null;

  const { data } = await supabase
    .from("public_timeline")
    .select("*")
    .eq("dedupe_hash", statusId)
    .eq("repo_id", repoData.id)
    .single();

  if (!data) return null;

  // Fetch like data for the item
  const { likeCount, isLiked } = await fetchLikeData(
    supabase,
    data.dedupe_hash,
    user?.id
  );

  return {
    ...data,
    likeCount,
    isLiked,
    isPrivate: repoData.is_private,
  };
}
