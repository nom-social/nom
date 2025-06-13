import { Octokit } from "@octokit/rest";
import { Json } from "@trigger.dev/sdk";
import z from "zod";

const pullRequestReviewSchema = z.object({
  action: z.enum(["submitted", "edited", "dismissed"]),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    user: z.object({
      login: z.string(),
    }),
    state: z.string(),
    html_url: z.string(),
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string() }),
  }),
  review: z.object({
    id: z.number(),
    state: z.string(),
    user: z.object({ login: z.string(), id: z.number() }),
    body: z.string(),
    html_url: z.string(),
  }),
});

export async function processPullRequestReviewEvent({
  event,
  githubToken,
  repo,
  org,
}: {
  event: Json;
  githubToken: string;
  repo: string;
  org: string;
}) {
  const validationResult = pullRequestReviewSchema.parse(event);
  const { action, pull_request, review } = validationResult;

  if (action !== "submitted") return null;

  const octokit = new Octokit({ auth: githubToken });

  const [prDetails, headCheckRuns] = await Promise.all([
    octokit.pulls.get({
      owner: org,
      repo: repo,
      pull_number: pull_request.number,
    }),
    octokit.checks.listForRef({
      owner: org,
      repo: repo,
      ref: pull_request.head.sha,
    }),
  ]);

  const prStats = {
    pull_request: {
      stats: {
        comments_count: prDetails.data.comments,
        additions: prDetails.data.additions,
        deletions: prDetails.data.deletions,
        changed_files: prDetails.data.changed_files,
      },
      head_checks: {
        total: headCheckRuns.data.total_count,
        passing: headCheckRuns.data.check_runs.filter(
          (check) => check.conclusion === "success"
        ).length,
        failing: headCheckRuns.data.check_runs.filter(
          (check) => check.conclusion === "failure"
        ).length,
      },
      head: { ref: pull_request.head.ref },
      base: { ref: pull_request.base.ref },
      user: { login: pull_request.user.login },
    },
    action,
    review: {
      state: review.state,
      user: { login: review.user.login },
      body: review.body,
      html_url: review.html_url,
    },
  };

  return { data: prStats, type: "pr update" };
}
