import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

import { syncUserStars } from "./shared/sync-subscriptions";

export const manualSyncUserSubscriptions = schemaTask({
  id: "manual-sync-user-subscriptions",
  schema: z.object({ userId: z.string() }),
  run: async (payload) => {
    logger.info("Starting manual user stars sync", {
      userId: payload.userId,
    });

    await syncUserStars(payload.userId);
  },
});
