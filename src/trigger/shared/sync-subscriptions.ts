import { logger, wait } from "@trigger.dev/sdk";
import { Octokit } from "@octokit/rest";

import { createAdminClient } from "@/utils/supabase/admin";

import { starredRepoSchema } from "./sync-subscriptions/schema";

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

export async function syncUserStars(userId: string) {
  const supabase = createAdminClient();

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

    // Get all user's starred repos with pagination
    const starredRepos = await getAllStarredRepos(octokit, userName);

    logger.info(
      `Found ${starredRepos.length} starred repos for user ${user.id}`
    );

    // Batch fetch all matching repositories using OR conditions for exact pairs
    const { data: matchingRepos } = await supabase
      .from("repositories")
      .select("id, org, repo")
      .or(
        starredRepos
          .map((repo) => `and(org.eq.${repo.owner.login},repo.eq.${repo.name})`)
          .join(",")
      )
      .throwOnError();

    // Create subscriptions for all matching repositories
    for (const repo of matchingRepos) {
      await supabase
        .from("subscriptions")
        .upsert(
          { user_id: user.id, repo_id: repo.id },
          { onConflict: "user_id,repo_id" }
        )
        .throwOnError();

      logger.info(
        `Upserted subscription for user ${user.id} to repo ${repo.id}`
      );
    }
  } catch (error) {
    logger.error("Error syncing stars for user", {
      error,
      userId: user.id,
    });
  }

  logger.info("Finished syncing user stars");
}
