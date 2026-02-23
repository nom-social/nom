"use server";

import { createClient } from "@/utils/supabase/server";
import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";

import { NotAuthenticatedError } from "./actions";

export async function createLike(dedupe_hash: string) {
  const supabase = await createClient();
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
