import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/supabase";

export type FeedItem = Tables<"public_timeline">;

export type FetchFeedItemParams = {
  statusId: string;
  repo: string;
  org: string;
};

export async function fetchFeedItem({
  statusId,
  repo,
  org,
}: FetchFeedItemParams): Promise<FeedItem | null> {
  const supabase = createClient(cookies());

  const { data: repoData } = await supabase
    .from("public_repository_data")
    .select("*")
    .eq("repo", repo)
    .eq("org", org)
    .single();

  if (!repoData) return null;

  const { data } = await supabase
    .from("public_timeline")
    .select("*")
    .eq("id", statusId)
    .eq("repo_id", repoData.id)
    .single();

  if (!data) return null;

  return data;
}
