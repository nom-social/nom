import { z } from "zod";
import { Octokit } from "@octokit/rest";

import { GitHubWebhookPayload } from "@/app/api/webhooks/github/schemas";

export async function processStarEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "star" }>
) {
  throw new Error(
    `Star event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPullRequestEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "pull_request" }>
) {
  throw new Error(
    `Pull request event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPullRequestReviewEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "pull_request_review" }>,
  githubToken: string
) {
  const pullRequestReviewSchema = z.object({
    action: z.enum(["submitted", "edited", "dismissed"]),
    pull_request: z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      user: z.object({
        login: z.string(),
        id: z.number(),
      }),
      state: z.string(),
      html_url: z.string(),
    }),
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string() }),
    review: z.object({
      id: z.number(),
      state: z.string(),
      user: z.object({ login: z.string(), id: z.number() }),
      body: z.string(),
      html_url: z.string(),
    }),
  });

  const validationResult = pullRequestReviewSchema.parse(event);
  const { action, pull_request, head, base, review } = validationResult;

  if (action !== "submitted") return null;

  const octokit = new Octokit({ auth: githubToken });

  const [prDetails, headCheckRuns] = await Promise.all([
    octokit.pulls.get({
      owner: event.repository.owner.login,
      repo: event.repository.name,
      pull_number: pull_request.number,
    }),
    octokit.checks.listForRef({
      owner: event.repository.owner.login,
      repo: event.repository.name,
      ref: head.sha,
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
      head: { ref: head.ref },
      base: { ref: base.ref },
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

  return prStats;
}

export async function processIssuesEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "issues" }>
) {
  throw new Error(
    `Issues event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processReleaseEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "release" }>
) {
  throw new Error(
    `Release event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processIssueCommentEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "issue_comment" }>
) {
  throw new Error(
    `Issue comment event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPullRequestReviewCommentEvent(
  event: Extract<
    GitHubWebhookPayload,
    { event_type: "pull_request_review_comment" }
  >
) {
  throw new Error(
    `Pull request review comment event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processPushEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "push" }>
) {
  throw new Error(
    `Push event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processStatusEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "status" }>
) {
  throw new Error(
    `Status event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processCreateEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "create" }>
) {
  throw new Error(
    `Create event processing not implemented for repository: ${event.repository.full_name}`
  );
}

export async function processDeleteEvent(
  event: Extract<GitHubWebhookPayload, { event_type: "delete" }>
) {
  throw new Error(
    `Delete event processing not implemented for repository: ${event.repository.full_name}`
  );
}

// Helper function to process any event type
export async function processEvent(
  event: GitHubWebhookPayload,
  githubToken: string
) {
  if (!githubToken) {
    throw new Error("GitHub token is required to process events");
  }

  switch (event.event_type) {
    case "star":
      return processStarEvent(event);
    case "pull_request":
      return processPullRequestEvent(event);
    case "pull_request_review":
      return processPullRequestReviewEvent(event, githubToken);
    case "issues":
      return processIssuesEvent(event);
    case "release":
      return processReleaseEvent(event);
    case "issue_comment":
      return processIssueCommentEvent(event);
    case "pull_request_review_comment":
      return processPullRequestReviewCommentEvent(event);
    case "push":
      return processPushEvent(event);
    case "status":
      return processStatusEvent(event);
    case "create":
      return processCreateEvent(event);
    case "delete":
      return processDeleteEvent(event);
    default:
      const unknownEvent = event as { event_type: string };
      throw new Error(`Unknown event type: ${unknownEvent.event_type}`);
  }
}
