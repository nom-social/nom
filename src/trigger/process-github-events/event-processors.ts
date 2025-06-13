import { z } from "zod";
import { Octokit } from "@octokit/rest";

import { Json } from "@/types/supabase";

export async function processStarEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("star"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "star" };
}

export async function processPullRequestEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("pull_request"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "pull_request" };
}

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

export async function processIssuesEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("issues"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "issues" };
}

export async function processReleaseEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("release"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "release" };
}

export async function processIssueCommentEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("issue_comment"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "issue_comment" };
}

export async function processPullRequestReviewCommentEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("pull_request_review_comment"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "pull_request_review_comment" };
}

export async function processPushEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("push"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "push" };
}

export async function processStatusEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("status"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "status" };
}

export async function processCreateEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("create"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "create" };
}

export async function processDeleteEvent(event: Json) {
  const eventSchema = z.object({
    event_type: z.literal("delete"),
  });
  const eventSchemaResult = eventSchema.parse(event);

  return { data: eventSchemaResult, type: "delete" };
}

// Helper function to process any event type
export async function processEvent({
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
  if (!githubToken) {
    throw new Error("GitHub token is required to process events");
  }

  const eventSchema = z.object({
    event_type: z.string(),
  });
  const eventSchemaResult = eventSchema.parse(event);

  switch (eventSchemaResult.event_type) {
    case "star":
      return processStarEvent(event);
    case "pull_request":
      return processPullRequestEvent(event);
    case "pull_request_review":
      return processPullRequestReviewEvent({
        event,
        githubToken,
        repo,
        org,
      });
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
