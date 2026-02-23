import { createClient } from "@/utils/supabase/client";
import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function isLiked(dedupe_hash: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { liked: false };
  }
  const userId = user.id;

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
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new NotAuthenticatedError();
  const userId = user.id;

  await supabase
    .from("timeline_likes")
    .insert({ user_id: userId, dedupe_hash })
    .throwOnError();

  await sendEngagementMilestoneTask.trigger(
    { dedupe_hash },
    { concurrencyKey: dedupe_hash }
  );
}

export async function deleteLike(dedupe_hash: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new NotAuthenticatedError();
  const userId = user.id;

  await supabase
    .from("timeline_likes")
    .delete()
    .eq("user_id", userId)
    .eq("dedupe_hash", dedupe_hash)
    .throwOnError();
}

export async function getLikeCount(dedupe_hash: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from("timeline_likes")
    .select("id", { count: "exact", head: true })
    .eq("dedupe_hash", dedupe_hash)
    .throwOnError();

  return count ?? 0;
}

getLikeCount.key = "src/components/shared/activity-card/actions/getLikeCount";
