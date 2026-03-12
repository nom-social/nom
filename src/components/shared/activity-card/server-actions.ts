"use server";

import { auth } from "@convex-dev/auth/nextjs/server";
import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";

export async function triggerEngagementMilestone(dedupe_hash: string) {
  try {
    const { userId } = await auth();
    if (!userId) return;

    await sendEngagementMilestoneTask.trigger(
      { dedupe_hash },
      { concurrencyKey: dedupe_hash },
    );
  } catch {}
}
