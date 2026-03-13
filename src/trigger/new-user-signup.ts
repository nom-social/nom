import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { subMonths } from "date-fns";

import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

import { syncUserStars } from "./shared/sync-subscriptions";

export const newUserSignUpTask = schemaTask({
  id: "new-user-signup-task",
  schema: z.object({ userId: z.string() }),
  run: async ({ userId }) => {
    const convex = createAdminConvexClient();
    const oneMonthAgoMs = subMonths(new Date(), 1).getTime();

    logger.info("Starting sync from public_timeline to user_timeline", {
      userId,
    });

    await syncUserStars(userId);

    const subscriptions = await convex.query(api.admin.getUserSubscriptions, {
      userId: userId as Id<"users">,
    });
    const repositoryIds = subscriptions.map((s: { repositoryId: string }) => s.repositoryId);

    const publicEvents = await Promise.all(
      repositoryIds.map((repoId: string) =>
        convex.query(api.admin.getPublicTimelineForRepo, {
          repositoryId: repoId,
          fromMs: oneMonthAgoMs,
        }),
      ),
    );
    const allEvents = publicEvents.flat();

    if (!allEvents.length) {
      logger.info("No public_timeline events found for user repos");
      return;
    }

    const entries = allEvents.map((event) => ({
      userId: userId as Id<"users">,
      repositoryId: event.repositoryId,
      data: event.data,
      type: event.type,
      score: event.score,
      isRead: false,
      categories: event.categories,
      searchText: event.searchText,
      eventIds: event.eventIds,
      dedupeHash: event.dedupeHash,
      createdAt: event.createdAt,
    }));

    await convex.mutation(api.admin.upsertUserTimelineEntries, { entries });

    logger.info("Finished syncing user timeline from public", {
      userId,
      totalSynced: entries.length,
    });
  },
});
