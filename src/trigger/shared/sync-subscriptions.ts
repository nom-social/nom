import { logger, wait } from "@trigger.dev/sdk";
import { Octokit } from "@octokit/rest";

import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

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

    const linkHeader = headers.link;
    hasMore = linkHeader?.includes('rel="next"') ?? false;
    page++;

    if (hasMore) await wait.for({ seconds: 1 });
  }

  return starredRepoSchema.parse(allRepos);
}

export async function syncUserStars(userId: string) {
  const convex = createAdminConvexClient();

  // Get GitHub access token from authAccounts
  const githubToken = await convex.query(api.admin.getGitHubAccessToken, {
    userId: userId as Id<"users">,
  });

  const user = await convex.query(api.admin.getUserById, {
    userId: userId as Id<"users">,
  });

  if (!user) {
    logger.error("User not found", { userId });
    return;
  }

  const providerToken = githubToken;
  const userName = user.githubUsername;

  if (!providerToken || !userName) {
    logger.error("Missing provider token or username", { userId });
    return;
  }

  try {
    const octokit = new Octokit({ auth: providerToken });
    const starredRepos = await getAllStarredRepos(octokit, userName);

    logger.info(`Found ${starredRepos.length} starred repos for user ${userId}`);

    for (const repo of starredRepos) {
      const repoDoc = await convex.query(api.admin.getRepository, {
        org: repo.owner.login,
        repo: repo.name,
      });

      if (repoDoc) {
        await convex.mutation(api.admin.upsertSubscription, {
          userId: userId as Id<"users">,
          repositoryId: repoDoc._id,
        });

        logger.info(`Upserted subscription for user ${userId} to repo ${repoDoc._id}`);
      }
    }
  } catch (error) {
    logger.error("Error syncing stars for user", { error, userId });
  }

  logger.info("Finished syncing user stars");
}
