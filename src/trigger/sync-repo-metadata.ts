import { z } from "zod";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { Octokit } from "@octokit/rest";

import { createClient } from "@/utils/supabase/background";

import { LANGUAGE_COLORS } from "./update-repo-metadata/constants";

// Zod schema for template validation
const templateSchema = z.string().max(1_000);

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
      .select(`id, org, repo, repositories_secure ( access_token )`)
      .throwOnError();

    logger.info(`Fetched ${repos.length} repositories`);

    for (const repo of repos) {
      try {
        const access_token =
          repo.repositories_secure?.access_token || undefined;
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

        // Fetch .nom templates from the root if present
        async function fetchNomTemplate(
          filename: string
        ): Promise<string | null> {
          try {
            const { data } = await octokit.repos.getContent({
              owner: repo.org,
              repo: repo.repo,
              path: `.nom/${filename}`,
            });
            // Handle both file and array (should be file)
            if (Array.isArray(data) || !("content" in data)) return null;
            // Decode base64 content
            const content = Buffer.from(data.content, "base64").toString(
              "utf-8"
            );
            // Validate with Zod
            const parsed = templateSchema.safeParse(content);
            return parsed.success ? content : null;
          } catch {
            // Not found or error
            return null;
          }
        }

        const [pullRequestTemplate, issueTemplate, releaseTemplate] =
          await Promise.all([
            fetchNomTemplate("pull_request_summary_template.txt"),
            fetchNomTemplate("issue_summary_template.txt"),
            fetchNomTemplate("release_summary_template.txt"),
          ]);

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

        // Update metadata in repositories
        await supabase
          .from("repositories")
          .update({ metadata })
          .eq("id", repo.id)
          .throwOnError();

        await supabase
          .from("repositories_secure")
          .update({
            settings: {
              pull_request_summary_template: pullRequestTemplate,
              issue_summary_template: issueTemplate,
              release_summary_template: releaseTemplate,
            },
          })
          .eq("id", repo.id)
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
