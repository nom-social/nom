import type { Octokit } from "@octokit/rest";
import { tool } from "ai";
import { z } from "zod";
import { logger } from "@trigger.dev/sdk";

import { filterAndFormatDiff } from "@/trigger/process-github-events/event-processors/shared/diff-utils";

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

    compare_refs: tool({
      description:
        "Compare two git refs (commit SHAs or tag names) to see what changed between them. Use for releases (e.g. v1.0...v2.0) or any base..head comparison. Returns commits, changed files, and diff.",
      inputSchema: z.object({
        base: z
          .string()
          .describe("Base ref: commit SHA or tag (e.g. abc123 or v1.0.0)"),
        head: z
          .string()
          .describe("Head ref: commit SHA or tag (e.g. def456 or v2.0.0)"),
      }),
      execute: async ({ base, head }: { base: string; head: string }) => {
        try {
          logger.info("Comparing refs", { org, repo, base, head });
          const basehead = `${base}...${head}`;
          const { data } = await octokit.repos.compareCommitsWithBasehead({
            owner: org,
            repo,
            basehead,
          });

          const { filteredFiles, diff: combinedDiff } = filterAndFormatDiff(
            data.files ?? []
          );

          let diff = combinedDiff;
          if (diff.length > MAX_FILE_CONTENT_BYTES * 2) {
            diff =
              diff.slice(0, MAX_FILE_CONTENT_BYTES * 2) +
              "\n\n... [diff truncated]";
          }

          const commitSummaries = (data.commits ?? [])
            .map(
              (c) =>
                `- ${c.sha?.slice(0, 7) ?? "?"} ${c.commit?.message?.split("\n")[0] ?? ""} (${c.commit?.author?.name ?? "unknown"})`
            )
            .join("\n");

          return {
            status: data.status,
            ahead_by: data.ahead_by,
            behind_by: data.behind_by,
            total_commits: data.total_commits,
            changed_files: filteredFiles.map((f) => f.filename),
            commits: commitSummaries || "No commits",
            diff: diff || "No diff (e.g. refs are identical)",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to compare refs";
          return { error: message };
        }
      },
    }),

    get_commit: tool({
      description:
        "Get details of a single commit by ref (SHA or tag): message, author, date, and changed files with diff.",
      inputSchema: z.object({
        ref: z
          .string()
          .describe("Git ref: commit SHA or tag name (e.g. abc123 or v1.0.0)"),
      }),
      execute: async ({ ref }: { ref: string }) => {
        try {
          logger.info("Getting commit", { org, repo, ref });
          const { data } = await octokit.repos.getCommit({
            owner: org,
            repo,
            ref,
          });

          const { filteredFiles, diff: combinedDiff } = filterAndFormatDiff(
            data.files ?? []
          );

          let diff = combinedDiff;
          if (diff.length > MAX_FILE_CONTENT_BYTES * 2) {
            diff =
              diff.slice(0, MAX_FILE_CONTENT_BYTES * 2) +
              "\n\n... [diff truncated]";
          }

          const commit = data.commit;
          return {
            sha: data.sha,
            message: commit?.message ?? "",
            author: commit?.author?.name ?? data.author?.login ?? "unknown",
            authored_at: commit?.author?.date,
            changed_files: filteredFiles.map((f) => f.filename),
            diff: diff || "No diff",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch commit";
          return { error: message };
        }
      },
    }),

    get_pull_request: tool({
      description:
        "Get full details of a pull request by number: title, body, reviews, changed files, and diff. Useful when you need PR context (e.g. for releases that reference merged PRs).",
      inputSchema: z.object({
        pull_number: z.number().describe("Pull request number"),
      }),
      execute: async ({ pull_number }: { pull_number: number }) => {
        try {
          logger.info("Getting pull request", { org, repo, pull_number });

          const [prData, reviews, filesData] = await Promise.all([
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
            octokit.pulls.listFiles({
              owner: org,
              repo,
              pull_number,
            }),
          ]);

          const { data: pr } = prData;
          const reviewSummaries = reviews.data
            .map(
              (r) =>
                `- ${r.user?.login ?? "unknown"} [${r.state}]: ${r.body ? r.body.substring(0, 200) : "No comment"}`
            )
            .join("\n");

          const { filteredFiles, diff: combinedDiff } = filterAndFormatDiff(
            filesData.data
          );

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
            changed_files: filteredFiles.map((f) => f.filename),
            diff: diff || "No diff available",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch PR";
          return { error: message };
        }
      },
    }),
  };
}
