import { Octokit } from "@octokit/rest";

import { filterAndFormatDiff } from "@/trigger/process-github-events/event-processors/shared/diff-utils";

export async function getProcessedPullRequestDiff(
  octokit: Octokit,
  repo: { org: string; repo: string },
  pullNumber: number
) {
  const { data: files } = await octokit.pulls.listFiles({
    owner: repo.org,
    repo: repo.repo,
    pull_number: pullNumber,
  });

  const { diff } = filterAndFormatDiff(files);
  return diff;
}
