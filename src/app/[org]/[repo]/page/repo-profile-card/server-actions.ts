"use server";

import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { sendSubscriberMilestoneTask } from "@/trigger/send-subscriber-milestone";

export async function triggerSubscriberMilestone(repositoryId: string) {
  try {
    const isAuthenticated = await isAuthenticatedNextjs();
    if (!isAuthenticated) return;

    await sendSubscriberMilestoneTask.trigger(
      { repo_id: repositoryId },
      { concurrencyKey: repositoryId },
    );
  } catch {}
}
