import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { escapeForIlike } from "@/lib/repo-utils";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";
import { createAdminClient } from "@/utils/supabase/admin";

export const syncBatchReposMetadataTask = schemaTask({
  id: "sync-batch-repos-metadata",
  schema: z.object({
    repos: z.array(z.object({ org: z.string(), repo: z.string() })),
  }),
  run: async ({ repos }) => {
    const supabase = createAdminClient();

    for (const { org, repo } of repos) {
      try {
        const { data: repoInfo } = await supabase
          .from("repositories")
          .select("id, org, repo")
          .ilike("org", escapeForIlike(org))
          .ilike("repo", escapeForIlike(repo))
          .single()
          .throwOnError();

        logger.info("Starting metadata sync for repo", { org, repo });
        const octokit = await createAuthenticatedOctokitClient({
          org,
          repo,
        });
        const [{ data: repoData }, { data: languagesData }] = await Promise.all(
          [
            octokit.repos.get({ owner: org, repo }),
            octokit.repos.listLanguages({ owner: org, repo }),
          ]
        );

        const languages = Object.entries(languagesData)
          .map(([name, bytes]) => ({
            name,
            bytes,
          }))
          .sort((a, b) => b.bytes - a.bytes);

        const metadata = {
          avatar_url: `https://github.com/${org}.png`,
          description: repoData.description || null,
          created_at: repoData.created_at || null,
          homepage_url: repoData.homepage || null,
          languages,
          license: repoData.license?.spdx_id || repoData.license?.name || null,
        };
        await supabase
          .from("repositories")
          .update({ metadata, is_private: repoData.private })
          .eq("id", repoInfo.id)
          .throwOnError();

        logger.info("Successfully updated metadata for repo", { org, repo });
      } catch (error) {
        logger.error("Error updating repo metadata", { org, repo, error });
      }
    }
  },
});
