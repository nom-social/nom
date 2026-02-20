import type { Octokit } from "@octokit/rest";
import { minimatch } from "minimatch";
import { tool } from "ai";
import { z } from "zod";
import { logger } from "@trigger.dev/sdk";

import { EXCLUDED_FILE_PATTERNS } from "@/trigger/process-github-events/event-processors/shared/constants";
import { getProcessedPullRequestDiff } from "@/trigger/process-github-events/event-processors/pull-request/utils";

const MAX_FILE_CONTENT_BYTES = 50_000;

export interface CreateEventToolsParams {
  octokit: Octokit;
  org: string;
  repo: string;
}

/**
 * Creates agent tools bound to a repo context for use in event processors.
 * Tools allow the model to explore files and access PR details on demand.
 */
export function createEventTools({
  octokit,
  org,
  repo,
}: CreateEventToolsParams) {
  return {
    explore_file: tool({
      description:
        "Read the content of a file or list files in a directory at a specific git ref (commit sha or tag). Use this to gain more context about code changes.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("File path (e.g. src/index.ts) or directory path"),
        ref: z
          .string()
          .describe("Git ref: commit SHA or tag name (e.g. abc123 or v1.0.0)"),
      }),
      execute: async ({ path, ref }: { path: string; ref: string }) => {
        try {
          logger.info("Exploring file", { org, repo, path, ref });
          const { data } = await octokit.repos.getContent({
            owner: org,
            repo,
            path,
            ref,
          });

          if (Array.isArray(data)) {
            const entries = data.map(
              (item) =>
                `${item.type === "dir" ? "📁" : "📄"} ${item.path}${item.type === "dir" ? "/" : ""}`
            );
            return { entries };
          }

          if (!("content" in data) || !data.content) {
            return { error: "File is empty or binary" };
          }

          const content = Buffer.from(data.content, "base64").toString("utf-8");
          if (content.length > MAX_FILE_CONTENT_BYTES) {
            return {
              content:
                content.slice(0, MAX_FILE_CONTENT_BYTES) +
                "\n\n... [truncated, file too large]",
            };
          }
          return { content };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch file";
          return { error: message };
        }
      },
    }),

    get_pull_request: tool({
      description:
        "Get full details of a pull request by number: title, body, reviews, changed files, and diff. Use this after list_pull_requests_for_commit to fetch details for specific PRs.",
      inputSchema: z.object({
        pull_number: z.number().describe("Pull request number"),
      }),
      execute: async ({ pull_number }: { pull_number: number }) => {
        try {
          logger.info("Getting pull request", { org, repo, pull_number });

          const [prData, reviews, combinedDiff] = await Promise.all([
            octokit.pulls.get({
              owner: org,
              repo,
              pull_number,
            }),
            octokit.pulls.listReviews({
              owner: org,
              repo,
              pull_number,
            }),
            getProcessedPullRequestDiff(octokit, { org, repo }, pull_number),
          ]);

          const { data: pr } = prData;
          const reviewSummaries = reviews.data
            .map(
              (r) =>
                `- ${r.user?.login ?? "unknown"} [${r.state}]: ${r.body ? r.body.substring(0, 200) : "No comment"}`
            )
            .join("\n");

          const { data: files } = await octokit.pulls.listFiles({
            owner: org,
            repo,
            pull_number,
          });
          const changedFiles = files
            .filter(
              (f) =>
                !EXCLUDED_FILE_PATTERNS.some((pattern) =>
                  minimatch(f.filename, pattern)
                )
            )
            .map((f) => f.filename);

          let diff = combinedDiff;
          if (diff.length > MAX_FILE_CONTENT_BYTES * 2) {
            diff =
              diff.slice(0, MAX_FILE_CONTENT_BYTES * 2) +
              "\n\n... [diff truncated]";
          }

          return {
            title: pr.title,
            body: pr.body,
            author: pr.user.login,
            reviews: reviewSummaries || "No reviews",
            changed_files: changedFiles,
            diff: diff || "No diff available",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch PR";
          return { error: message };
        }
      },
    }),

    list_pull_requests_for_commit: tool({
      description:
        "List pull request numbers associated with a commit. Use this to find PRs that contain a specific commit (e.g. for push events). Then use get_pull_request with a specific pull_number to fetch full details.",
      inputSchema: z.object({
        commit_sha: z.string().describe("Commit SHA to find associated PRs"),
      }),
      execute: async ({ commit_sha }: { commit_sha: string }) => {
        try {
          logger.info("Listing PRs for commit", {
            org,
            repo,
            commit_sha,
          });
          const { data: pulls } =
            await octokit.repos.listPullRequestsAssociatedWithCommit({
              owner: org,
              repo,
              commit_sha,
            });
          return {
            pr_numbers: pulls.map((p) => p.number),
          };
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to list PRs for commit";
          return { error: message };
        }
      },
    }),
  };
}
