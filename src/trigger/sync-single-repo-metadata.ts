import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

import { createClient } from "@/utils/supabase/background";

import { LANGUAGE_COLORS } from "./sync-single-repo-metadata/constants";

// Zod schema for template validation
const templateSchema = z.string().max(1_000);

async function fetchNomTemplate({
  filename,
  repo,
  octokit,
}: {
  filename: string;
  repo: {
    org: string;
    repo: string;
  };
  octokit: Octokit;
}): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: repo.org,
      repo: repo.repo,
      path: `.nom/${filename}`,
    });
    if (Array.isArray(data) || !("content" in data)) return null;
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = templateSchema.safeParse(content);
    return parsed.success ? content : null;
  } catch {
    return null;
  }
}

export const syncSingleRepoMetadataTask = schemaTask({
  id: "sync-single-repo-metadata",
  schema: z.object({
    org: z.string(),
    repo: z.string(),
  }),
  run: async ({ org, repo }) => {
    const supabase = createClient();
    const { data: repoInfo } = await supabase
      .from("repositories")
      .select("id, repositories_secure ( access_token )")
      .eq("org", org)
      .eq("repo", repo)
      .single()
      .throwOnError();

    logger.info("Starting metadata sync for repo", { org, repo });
    const octokit = new Octokit({
      auth: repoInfo.repositories_secure?.access_token,
    });
    const [{ data: repoData }, { data: languagesData }] = await Promise.all([
      octokit.repos.get({ owner: org, repo }),
      octokit.repos.listLanguages({ owner: org, repo }),
    ]);

    const [pullRequestTemplate, issueTemplate, releaseTemplate, pushTemplate] =
      await Promise.all([
        fetchNomTemplate({
          filename: "pull_request_summary_template.txt",
          repo: { org, repo },
          octokit,
        }),
        fetchNomTemplate({
          filename: "issue_summary_template.txt",
          repo: { org, repo },
          octokit,
        }),
        fetchNomTemplate({
          filename: "release_summary_template.txt",
          repo: { org, repo },
          octokit,
        }),
        fetchNomTemplate({
          filename: "push_summary_template.txt",
          repo: { org, repo },
          octokit,
        }),
      ]);

    const languages = Object.entries(languagesData)
      .map(([name, bytes]) => ({
        name,
        bytes,
        color: LANGUAGE_COLORS[name] || null,
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
      .update({ metadata })
      .eq("id", repoInfo.id)
      .throwOnError();

    await supabase
      .from("repositories_secure")
      .upsert(
        {
          settings: {
            pull_request_summary_template: pullRequestTemplate,
            issue_summary_template: issueTemplate,
            release_summary_template: releaseTemplate,
            push_summary_template: pushTemplate,
          },
          id: repoInfo.id,
        },
        { onConflict: "id" }
      )
      .throwOnError();

    logger.info("Successfully updated metadata for repo", { org, repo });
    return { success: true };
  },
});
