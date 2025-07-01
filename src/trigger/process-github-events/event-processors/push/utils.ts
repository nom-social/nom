import { Octokit } from "@octokit/rest";
import { minimatch } from "minimatch";

import { EXCLUDED_FILE_PATTERNS } from "@/trigger/process-github-events/event-processors/shared/constants";

export async function getCommitDiff(
  octokit: Octokit,
  repo: { org: string; repo: string },
  commitId: string
) {
  let commitDiff = "";
  const commitResp = await octokit.repos.getCommit({
    owner: repo.org,
    repo: repo.repo,
    ref: commitId,
  });
  if (commitResp.data.files) {
    commitDiff = commitResp.data.files
      .filter(
        (file) =>
          !EXCLUDED_FILE_PATTERNS.some((pattern) =>
            minimatch(file.filename, pattern)
          )
      )
      .map((file) => {
        if (!file.patch) return null;
        return `=== File: ${file.filename} ===\n${file.patch}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return commitDiff;
}
