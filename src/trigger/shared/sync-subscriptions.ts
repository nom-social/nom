import { logger, wait } from "@trigger.dev/sdk/v3";
import { Octokit } from "@octokit/rest";

import { createClient } from "@/utils/supabase/background";

import { starredRepoSchema, watchedRepoSchema } from "./schema";

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
        visibility: "all",
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

async function getAllWatchedRepos(octokit: Octokit) {
  let page = 1;
  let hasMore = true;
  const allRepos = [];

  while (hasMore) {
    const { data: watchedReposData, headers } =
      await octokit.activity.listWatchedReposForAuthenticatedUser({
        per_page: 100,
        page,
      });

    allRepos.push(...watchedReposData);

    // Check if there are more pages by looking at the Link header
    const linkHeader = headers.link;
    hasMore = linkHeader?.includes('rel="next"') ?? false;
    page++;

    // Add a small delay between pages to avoid rate limiting
    if (hasMore) await wait.for({ seconds: 1 });
  }

  return watchedRepoSchema.parse(allRepos);
}

export async function syncUserStars(userId: string) {
  // Get users with GitHub provider tokens using auth API
  const {
    data: { user },
    error,
  } = await supabase.auth.admin.getUserById(userId);
  if (error || !user) {
    logger.error("Error fetching user", { error });
    return;
  }

  try {
    const providerToken = user.user_metadata?.provider_token;
    const userName = user.user_metadata?.user_name;
    if (!providerToken || !userName) {
      logger.error("Missing provider token or username", { userId });
      return;
    }

    // Initialize Octokit with user's token
    const octokit = new Octokit({ auth: providerToken });

    // Get all user's starred and watched repos with pagination
    const [starredRepos, watchedRepos] = await Promise.all([
      getAllStarredRepos(octokit, userName),
      getAllWatchedRepos(octokit),
    ]);

    logger.info(
      `Found ${starredRepos.length} starred repos and ${watchedRepos.length} ` +
        `watched repos for user ${user.id}`
    );

    // Get all current subscriptions for this user
    const { data: currentSubscriptions } = await supabase
      .from("subscriptions")
      .select("id, repo_id, repositories!inner(org, repo)")
      .eq("user_id", user.id)
      .throwOnError();

    // Create sets of currently starred and watched repo identifiers for quick lookup
    const starredRepoIds = new Set(
      starredRepos.map((repo) => `${repo.owner.login}/${repo.name}`)
    );
    const watchedRepoIds = new Set(
      watchedRepos.map((repo) => `${repo.owner.login}/${repo.name}`)
    );

    // Combine all unique repos from both starred and watched
    const allRepos = new Set([...starredRepoIds, ...watchedRepoIds]);

    // Build array of { org, repo } pairs for batch query
    const repoPairs = Array.from(allRepos).map((repoId) => {
      const [org, repo] = repoId.split("/");
      return { org, repo };
    });

    // Batch fetch all matching repositories using OR conditions for exact pairs
    const { data: matchingRepos } = await supabase
      .from("repositories")
      .select("id, org, repo")
      .or(
        repoPairs
          .map((pair) => `and(org.eq.${pair.org},repo.eq.${pair.repo})`)
          .join(",")
      )
      .throwOnError();

    // Create a lookup map for constant-time access
    const repoLookup = new Map(
      matchingRepos.map((repo) => [`${repo.org}/${repo.repo}`, repo.id])
    );

    // For each repo (from both starred and watched), check if it exists in our repositories table
    for (const repoId of allRepos) {
      const repoIdInDb = repoLookup.get(repoId);

      if (repoIdInDb) {
        // Check if subscription already exists
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("repo_id", repoIdInDb)
          .single();

        if (!existingSub) {
          // Create new subscription
          await supabase
            .from("subscriptions")
            .insert({ user_id: user.id, repo_id: repoIdInDb })
            .throwOnError();

          logger.info(
            `Created subscription for user ${user.id} to repo ${repoIdInDb}`
          );
        }
      }
    }

    // Remove subscriptions for repos that are no longer starred or watched
    for (const subscription of currentSubscriptions) {
      const repoIdentifier =
        `${subscription.repositories.org}/` +
        `${subscription.repositories.repo}`;
      if (!allRepos.has(repoIdentifier)) {
        await supabase
          .from("subscriptions")
          .delete()
          .eq("id", subscription.id)
          .throwOnError();

        logger.info(
          `Removed subscription for user ${user.id} to repo ` +
            `${subscription.repo_id} (no longer starred or watched)`
        );
      }
    }
  } catch (error) {
    logger.error("Error syncing stars and watched repos for user", {
      error,
      userId: user.id,
    });
  }

  logger.info("Finished syncing user stars and watched repos");
}
