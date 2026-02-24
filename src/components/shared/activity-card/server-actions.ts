"use server";

import { createClient } from "@/utils/supabase/server";
import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";

export async function triggerEngagementMilestone(dedupe_hash: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await sendEngagementMilestoneTask.trigger({ dedupe_hash });
  } catch {}
}
