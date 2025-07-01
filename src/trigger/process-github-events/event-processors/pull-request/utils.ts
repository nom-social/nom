import { Octokit } from "@octokit/rest";
import { minimatch } from "minimatch";

import { EXCLUDED_FILE_PATTERNS } from "@/trigger/process-github-events/event-processors/shared/constants";

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

  // Filter out files matching excluded patterns
  const filteredFiles = files.filter((file) => {
    return !EXCLUDED_FILE_PATTERNS.some((pattern) =>
      minimatch(file.filename, pattern)
    );
  });

  // Combine diffs into a single text
  const combinedDiff = filteredFiles
    .map((file) => {
      const parts: string[] = [];

      // Add file header
      parts.push(`=== File: ${file.filename} ===`);

      // Handle renamed files
      if (file.status === "renamed") {
        parts.push(`Renamed from: ${file.previous_filename}`);
        parts.push("No content changes");
      } else if (!file.patch) {
        // Skip binary files
        return null;
      } else {
        parts.push(file.patch);
      }

      parts.push(""); // Add spacing between files
      return parts.join("\n");
    })
    .filter((diff): diff is string => diff !== null)
    .join("\n");

  return combinedDiff;
}
