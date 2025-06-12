import { logger, schedules, wait } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";

import { syncUserStars as syncUserStarsUtil } from "./shared/sync-subscriptions";

// Initialize Supabase client
const supabase = createClient();

export const syncUserSubscriptions = schedules.task({
  id: "sync-user-subscriptions",
  // Run every hour
  cron: "0 * * * *",
  maxDuration: 300, // 5 minutes max runtime
  run: async (payload) => {
    logger.info("Starting user stars sync", {
      timestamp: payload.timestamp,
      timezone: payload.timezone,
    });

    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const {
        data: { users },
        error,
      } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: pageSize,
      });

      if (error) {
        logger.error("Error fetching users", { error, page });
        return;
      }

      if (users.length === 0) {
        hasMore = false;
        continue;
      }

      logger.info("Processing users batch", {
        page,
        batchSize: users.length,
      });

      for (const user of users) {
        await syncUserStarsUtil(user.id);
        await wait.for({ seconds: 1 });
      }

      page++;
    }
  },
});
