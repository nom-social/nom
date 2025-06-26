import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { subMonths } from "date-fns";

import { createClient } from "@/utils/supabase/background";
import { TablesInsert } from "@/types/supabase";

export const devSyncUserTimelineFromPublic = schemaTask({
  id: "dev-sync-user-timeline-from-public",
  schema: z.object({
    userId: z.string(),
    repoIds: z.array(z.string()),
  }),
  run: async ({ userId, repoIds }) => {
    logger.info("Starting sync from public_timeline to user_timeline", {
      userId,
      repoIds,
    });

    const supabase = createClient();
    const oneMonthAgo = subMonths(new Date(), 1).toISOString();

    if (!repoIds.length) {
      logger.info("No repoIds provided, skipping sync");
      return;
    }

    // Fetch all public_timeline events for the given repoIds in a single query
    const { data: publicEvents, error } = await supabase
      .from("public_timeline")
      .select("*")
      .in("repo_id", repoIds)
      .gte("created_at", oneMonthAgo)
      .throwOnError();

    if (error) {
      logger.error("Error fetching public_timeline events", { error });
      return;
    }
    if (!publicEvents || publicEvents.length === 0) {
      logger.info("No public_timeline events found for provided repoIds");
      return;
    }

    // Prepare user_timeline upserts
    const userTimelineEntries: TablesInsert<"user_timeline">[] =
      publicEvents.map((event) => ({
        user_id: userId,
        categories: event.categories,
        created_at: event.created_at,
        data: event.data,
        dedupe_hash: event.dedupe_hash,
        event_ids: event.event_ids,
        is_read: false,
        repo_id: event.repo_id,
        score: event.score,
        snooze_to: event.snooze_to,
        type: event.type,
        updated_at: new Date().toISOString(),
      }));

    await supabase
      .from("user_timeline")
      .upsert(userTimelineEntries, { onConflict: "user_id,dedupe_hash" })
      .throwOnError();

    logger.info("Finished syncing user timeline from public", {
      userId,
      totalSynced: userTimelineEntries.length,
    });
  },
});
