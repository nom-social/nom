import { logger, schedules } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";
import { syncBatchReposMetadataTask } from "./sync-batch-repos-metadata";

export const syncRepoMetadata = schedules.task({
  id: "sync-repo-metadata",
  // Run every 10 minutes
  cron: "*/10 * * * *",
  maxDuration: 600, // 10 minutes max runtime
  run: async () => {
    const supabase = createClient();
    logger.info("Starting repository metadata update");

    // Fetch all repositories with metadata and access_token
    const { data: repos } = await supabase
      .from("repositories")
      .select("id, org, repo, repositories_secure ( access_token )")
      .throwOnError();

    logger.info(`Fetched ${repos.length} repositories`);

    await syncBatchReposMetadataTask.triggerAndWait({
      repos: repos.map((repo) => ({ org: repo.org, repo: repo.repo })),
    });

    logger.info("Finished updating repository metadata");
  },
});
