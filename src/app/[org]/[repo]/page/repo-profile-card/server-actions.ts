"use server";

import { auth } from "@convex-dev/auth/nextjs/server";
import { sendSubscriberMilestoneTask } from "@/trigger/send-subscriber-milestone";

export async function triggerSubscriberMilestone(repositoryId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return;

    await sendSubscriberMilestoneTask.trigger(
      { repo_id: repositoryId },
      { concurrencyKey: repositoryId },
    );
  } catch {}
}
