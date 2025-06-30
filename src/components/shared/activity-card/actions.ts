import { createClient } from "@/utils/supabase/client";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function isLiked(dedupe_hash: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { liked: false };
  }
  const userId = session.user.id;

  const { data: likeData } = await supabase
    .from("timeline_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("dedupe_hash", dedupe_hash)
    .maybeSingle();

  return { liked: !!likeData };
}

isLiked.key = "src/components/shared/activity-card/actions/isLiked";

export async function createLike(dedupe_hash: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new NotAuthenticatedError();
  const userId = session.user.id;

  await supabase
    .from("timeline_likes")
    .insert({ user_id: userId, dedupe_hash })
    .throwOnError();
}

export async function deleteLike(dedupe_hash: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new NotAuthenticatedError();
  const userId = session.user.id;

  await supabase
    .from("timeline_likes")
    .delete()
    .eq("user_id", userId)
    .eq("dedupe_hash", dedupe_hash)
    .throwOnError();
}
