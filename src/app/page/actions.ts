import { Tables } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

export type FeedItem = Tables<"user_timeline">;

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function fetchFeed({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) throw new NotAuthenticatedError();

  const { data } = await supabase
    .from("user_timeline")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const repoIds = Array.from(new Set(data.map((item) => item.repo_id)));

  const { data: repos } = await supabase
    .from("public_repository_data")
    .select("*")
    .in("id", repoIds)
    .throwOnError();

  const repoDataMap = repos.reduce<
    Record<string, Tables<"public_repository_data">>
  >((acc, repo) => {
    acc[repo.id] = repo;
    return acc;
  }, {});

  const items = data.map((item) => ({
    ...item,
    repo: repoDataMap[item.repo_id],
  }));

  // If we got less than limit, there are no more items
  const hasMore = items.length === limit;

  return { items, hasMore };
}
