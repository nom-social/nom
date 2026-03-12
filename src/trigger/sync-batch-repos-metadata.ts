import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";

export const syncBatchReposMetadataTask = schemaTask({
  id: "sync-batch-repos-metadata",
  schema: z.object({
    repos: z.array(z.object({ org: z.string(), repo: z.string() })),
  }),
  run: async ({ repos }) => {
    const convex = createAdminConvexClient();

    for (const { org, repo } of repos) {
      try {
        const repoDoc = await convex.query(api.admin.getRepository, {
          org,
          repo,
        });
        if (!repoDoc) {
          logger.warn("Repository not found", { org, repo });
          continue;
        }

        logger.info("Starting metadata sync for repo", { org, repo });
        const octokit = await createAuthenticatedOctokitClient({ org, repo });
        const [{ data: repoData }, { data: languagesData }] = await Promise.all(
          [
            octokit.repos.get({ owner: org, repo }),
            octokit.repos.listLanguages({ owner: org, repo }),
          ],
        );

        const languages = Object.entries(languagesData)
          .map(([name, bytes]) => ({ name, bytes }))
          .sort((a, b) => b.bytes - a.bytes);

        const metadata = {
          avatar_url: `https://github.com/${org}.png`,
          description: repoData.description || null,
          created_at: repoData.created_at || null,
          homepage_url: repoData.homepage || null,
          languages,
          license: repoData.license?.spdx_id || repoData.license?.name || null,
        };

        await convex.mutation(api.admin.updateRepositoryMetadata, {
          repositoryId: repoDoc._id,
          metadata,
          isPrivate: repoData.visibility === "private",
        });

        logger.info("Successfully updated metadata for repo", { org, repo });
      } catch (error) {
        logger.error("Error updating repo metadata", { org, repo, error });
      }
    }
  },
});
