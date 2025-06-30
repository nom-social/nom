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
    .select("*, repositories ( org, repo )")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data;
  // If we got less than limit, there are no more items
  const hasMore = items.length === limit;

  return { items, hasMore };
}

fetchFeed.key = "src/app/page/feed/actions/fetchFeed";

export async function fetchPublicFeed({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("public_timeline")
    .select("*, repositories ( org, repo )")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .throwOnError();

  const items = data;
  // If we got less than limit, there are no more items
  const hasMore = items.length === limit;

  return { items, hasMore };
}

fetchPublicFeed.key = "src/app/page/feed/actions/fetchPublicFeed";
