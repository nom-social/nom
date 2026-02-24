"use server";

import { createClient } from "@/utils/supabase/server";
import { sendSubscriberMilestoneTask } from "@/trigger/send-subscriber-milestone";

export async function triggerSubscriberMilestone(repo_id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await sendSubscriberMilestoneTask.trigger(
      { repo_id },
      { concurrencyKey: repo_id }
    );
  } catch {}
}
