import { z } from "zod";

import { Json } from "@/types/supabase";

import { processPullRequestReviewEvent } from "./event-processors/pull-request-review";

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
