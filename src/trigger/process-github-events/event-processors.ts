import { z } from "zod";

import { Json } from "@/types/supabase";

import { processPullRequestReviewEvent } from "./event-processors/pull-request-review";

export async function processStarEvent() {
  throw new Error("Not implemented");
}

export async function processPullRequestEvent() {
  throw new Error("Not implemented");
}

export async function processIssuesEvent() {
  throw new Error("Not implemented");
}

export async function processReleaseEvent() {
  throw new Error("Not implemented");
}

export async function processIssueCommentEvent() {
  throw new Error("Not implemented");
}

export async function processPullRequestReviewCommentEvent() {
  throw new Error("Not implemented");
}

export async function processPushEvent() {
  throw new Error("Not implemented");
}

export async function processStatusEvent() {
  throw new Error("Not implemented");
}

export async function processCreateEvent() {
  throw new Error("Not implemented");
}

export async function processDeleteEvent() {
  throw new Error("Not implemented");
}

// Helper function to process any event type
export async function processEvent({
  event,
  githubToken,
  repo,
  org,
}: {
  event: Json;
  githubToken?: string;
  repo: string;
  org: string;
}) {
  const eventSchema = z.object({ event_type: z.string() });
  const eventSchemaResult = eventSchema.parse(event);

  switch (eventSchemaResult.event_type) {
    case "star":
      return processStarEvent();
    case "pull_request":
      return processPullRequestEvent();
    case "pull_request_review":
      return processPullRequestReviewEvent({
        event,
        githubToken,
        repo,
        org,
      });
    case "issues":
      return processIssuesEvent();
    case "release":
      return processReleaseEvent();
    case "issue_comment":
      return processIssueCommentEvent();
    case "pull_request_review_comment":
      return processPullRequestReviewCommentEvent();
    case "push":
      return processPushEvent();
    case "status":
      return processStatusEvent();
    case "create":
      return processCreateEvent();
    case "delete":
      return processDeleteEvent();
    default:
      const unknownEvent = event as { event_type: string };
      throw new Error(`Unknown event type: ${unknownEvent.event_type}`);
  }
}
