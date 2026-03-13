"use server";

import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";

export async function triggerEngagementMilestone(dedupe_hash: string) {
  try {
    const isAuthenticated = await isAuthenticatedNextjs();
    if (!isAuthenticated) return;

    await sendEngagementMilestoneTask.trigger(
      { dedupe_hash },
      { concurrencyKey: dedupe_hash },
    );
  } catch {}
}
