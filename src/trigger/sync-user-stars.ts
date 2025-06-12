import { logger, schedules, wait } from "@trigger.dev/sdk/v3";
import { Octokit } from "@octokit/rest";
import { z } from "zod";

import { createClient } from "@/utils/supabase/background";

// Initialize Supabase client
const supabase = createClient();

const starredRepoSchema = z.array(
  z.object({
    owner: z.object({ login: z.string() }),
    name: z.string(),
  })
);

async function getAllStarredRepos(octokit: Octokit, username: string) {
  let page = 1;
  let hasMore = true;
  const allRepos = [];

  while (hasMore) {
    const { data: starredReposData, headers } =
      await octokit.activity.listReposStarredByUser({
        username,
        per_page: 100,
        page,
      });

    allRepos.push(...starredReposData);

    // Check if there are more pages by looking at the Link header
    const linkHeader = headers.link;
    hasMore = linkHeader?.includes('rel="next"') ?? false;
    page++;

    // Add a small delay between pages to avoid rate limiting
    if (hasMore) await wait.for({ seconds: 1 });
  }

  return starredRepoSchema.parse(allRepos);
}

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
      try {
        const providerToken = user.user_metadata?.provider_token;
        const userName = user.user_metadata?.user_name;
        if (!providerToken || !userName) continue;

        // Initialize Octokit with user's token
        const octokit = new Octokit({ auth: providerToken });

        // Get all user's starred repos with pagination
        const starredRepos = await getAllStarredRepos(octokit, userName);

        logger.info(
          `Found ${starredRepos.length} starred repos for user ${user.id}`
        );

        // For each starred repo, check if it exists in our repositories table
        for (const starredRepo of starredRepos) {
          const { data: repo } = await supabase
            .from("repositories")
            .select("id")
            .eq("org", starredRepo.owner.login)
            .eq("repo", starredRepo.name)
            .single();

          if (repo) {
            // Check if subscription already exists
            const { data: existingSub } = await supabase
              .from("subscriptions")
              .select("id")
              .eq("user_id", user.id)
              .eq("repo_id", repo.id)
              .single();

            if (!existingSub) {
              // Create new subscription
              await supabase
                .from("subscriptions")
                .insert({ user_id: user.id, repo_id: repo.id })
                .throwOnError();

              logger.info(
                `Created subscription for user ${user.id} to repo ${repo.id}`
              );
            }
          }
        }
      } catch (error) {
        logger.error("Error syncing stars for user", {
          error,
          userId: user.id,
        });
      }
    }

    logger.info("Finished syncing user stars");
  },
});
