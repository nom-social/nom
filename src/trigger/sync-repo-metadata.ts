import { logger, schedules } from "@trigger.dev/sdk/v3";
import { Octokit } from "@octokit/rest";

import { createClient } from "@/utils/supabase/background";

import { LANGUAGE_COLORS } from "./update-repo-metadata/constants";

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
      .select(`id, org, repo, access_token`) // join repositories by id
      .throwOnError();

    logger.info(`Fetched ${repos.length} repositories`);

    for (const repo of repos) {
      try {
        const access_token = repo.access_token || undefined;
        const octokit = new Octokit({ auth: access_token });

        // Fetch repo details
        const [{ data: repoData }, { data: languagesData }] = await Promise.all(
          [
            octokit.repos.get({
              owner: repo.org,
              repo: repo.repo,
            }),
            octokit.repos.listLanguages({
              owner: repo.org,
              repo: repo.repo,
            }),
          ]
        );

        // Convert to array with color
        const languages = Object.entries(languagesData)
          .map(([name, bytes]) => ({
            name,
            bytes,
            color: LANGUAGE_COLORS[name] || null,
          }))
          .sort((a, b) => b.bytes - a.bytes);

        // Prepare metadata
        const metadata = {
          avatar_url: `https://github.com/${repo.org}.png`,
          description: repoData.description || null,
          created_at: repoData.created_at || null,
          homepage_url: repoData.homepage || null,
          languages,
          license: repoData.license?.spdx_id || repoData.license?.name || null,
        };

        // Update metadata in public_repository_data
        await supabase
          .from("public_repository_data")
          .upsert(
            {
              metadata,
              org: repo.org,
              repo: repo.repo,
              id: repo.id,
            },
            { onConflict: "id" }
          )
          .throwOnError();

        logger.info("Updated metadata for repo", {
          repo: repo.repo,
          org: repo.org,
        });
      } catch (error) {
        logger.error("Error updating repo metadata", {
          error,
          repo: repo.repo,
          org: repo.org,
        });
      }
    }

    logger.info("Finished updating repository metadata");
  },
});
