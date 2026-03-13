import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { syncBatchReposMetadataTask } from "@/trigger/sync-batch-repos-metadata";
import { backfillConnectedReposTask } from "@/trigger/backfill-connected-repos";

export async function createNewRepo({
  convex,
  repos,
  senderLogin,
  installationId,
}: {
  repos: { org: string; repo: string }[];
  convex: ConvexHttpClient;
  senderLogin: string;
  installationId: number;
}) {
  const user = await convex.query(api.admin.getUserByGithubUsername, {
    githubUsername: senderLogin,
  });

  const repositoryIds: string[] = [];

  for (const { org, repo } of repos) {
    const repositoryId = await convex.mutation(api.admin.upsertRepository, {
      org,
      repo,
      championGithubUsername: user ? undefined : senderLogin,
      isPrivate: false,
    });

    await convex.mutation(api.admin.upsertRepositorySecure, {
      repositoryId,
      installationId,
    });

    if (user) {
      await convex.mutation(api.admin.upsertRepositoryUser, {
        userId: user._id,
        repositoryId,
      });
    }

    repositoryIds.push(repositoryId);
  }

  // Fetch repo details for background tasks
  const repoDetails = await convex.query(api.admin.getRepositoriesByIds, {
    repositoryIds,
  });

  const reposForTasks = repoDetails
    .filter(Boolean)
    .map((r: { org: string; repo: string } | null) => ({ org: r!.org, repo: r!.repo }));

  await syncBatchReposMetadataTask.trigger({ repos: reposForTasks });
  await backfillConnectedReposTask.trigger({ repos: reposForTasks });
}
