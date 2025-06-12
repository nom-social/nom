import { logger, schedules } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";

import { syncUserStars as syncUserStarsUtil } from "./shared/sync-stars";

// Initialize Supabase client
const supabase = createClient();

export const syncUserStars = schedules.task({
  id: "sync-user-stars",
  // Run every hour
  cron: "0 * * * *",
  maxDuration: 300, // 5 minutes max runtime
  run: async (payload) => {
    logger.info("Starting user stars sync", {
      timestamp: payload.timestamp,
      timezone: payload.timezone,
    });

    // Get all users with GitHub provider tokens using auth API
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();
    if (error) {
      logger.error("Error fetching users", { error });
      return;
    }

    for (const user of users) {
      await syncUserStarsUtil(user.id);
    }
  },
});
