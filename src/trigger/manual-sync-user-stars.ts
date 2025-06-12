import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { Octokit } from "@octokit/rest";
import { z } from "zod";

import { createClient } from "@/utils/supabase/background";

import { starredRepoSchema } from "./shared/schema";

// Initialize Supabase client
const supabase = createClient();

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
    if (hasMore) await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return starredRepoSchema.parse(allRepos);
}

export const manualSyncUserStars = schemaTask({
  id: "manual-sync-user-stars",
  schema: z.object({ userId: z.string() }),
  run: async (payload) => {
    logger.info("Starting manual user stars sync", {
      userId: payload.userId,
    });

    // Get users with GitHub provider tokens using auth API
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(payload.userId);
    if (error || !user) {
      logger.error("Error fetching user", { error });
      return;
    }

    try {
      const providerToken = user.user_metadata?.provider_token;
      const userName = user.user_metadata?.user_name;

      // Initialize Octokit with user's token
      const octokit = new Octokit({ auth: providerToken });

      // Get all user's starred repos with pagination
      const starredRepos = await getAllStarredRepos(octokit, userName);

      logger.info(
        `Found ${starredRepos.length} starred repos for user ${user.id}`
      );

      // Get all current subscriptions for this user
      const { data: currentSubscriptions } = await supabase
        .from("subscriptions")
        .select("id, repo_id, repositories!inner(org, repo)")
        .eq("user_id", user.id);

      // Create a set of currently starred repo identifiers for quick lookup
      const starredRepoIds = new Set(
        starredRepos.map((repo) => `${repo.owner.login}/${repo.name}`)
      );

      // Track which repos we've processed to avoid duplicates
      const processedRepos = new Set<string>();

      // For each starred repo, check if it exists in our repositories table
      for (const starredRepo of starredRepos) {
        const repoIdentifier = `${starredRepo.owner.login}/${starredRepo.name}`;
        processedRepos.add(repoIdentifier);

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

      // Remove subscriptions for repos that are no longer starred
      if (currentSubscriptions) {
        for (const subscription of currentSubscriptions) {
          const repoIdentifier =
            `${subscription.repositories.org}/` +
            `${subscription.repositories.repo}`;
          if (!starredRepoIds.has(repoIdentifier)) {
            await supabase
              .from("subscriptions")
              .delete()
              .eq("id", subscription.id)
              .throwOnError();

            logger.info(
              `Removed subscription for user ${user.id} to repo ` +
                `${subscription.repo_id} (no longer starred)`
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

    logger.info("Finished syncing user stars");
  },
});
