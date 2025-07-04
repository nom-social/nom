import { Octokit } from "@octokit/rest";

import { syncBatchReposMetadataTask } from "@/trigger/sync-batch-repos-metadata";

export default async function propagateLicenseChange({
  octokit,
  repo,
  ref,
}: {
  octokit: Octokit;
  repo: { org: string; repo: string };
  ref: string;
}) {
  const commitResp = await octokit.repos.getCommit({
    owner: repo.org,
    repo: repo.repo,
    ref,
  });
  if (commitResp.data.files) {
    const licenseChanged = commitResp.data.files.some((file) =>
      /^LICENSE(\..*)?$/i.test(file.filename)
    );
    if (!licenseChanged) return;

    await syncBatchReposMetadataTask.trigger({
      repos: [{ org: repo.org, repo: repo.repo }],
    });
  }
}
