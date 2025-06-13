import { z } from "zod";

import { Json } from "@/types/supabase";

import { processPullRequestReviewEvent } from "./event-processors/pull-request-review";

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
      throw new Error("Not implemented");
    case "pull_request":
      throw new Error("Not implemented");
    case "pull_request_review":
      return processPullRequestReviewEvent({
        event,
        githubToken,
        repo,
        org,
      });
    case "issues":
      throw new Error("Not implemented");
    case "release":
      throw new Error("Not implemented");
    case "issue_comment":
      throw new Error("Not implemented");
    case "pull_request_review_comment":
      throw new Error("Not implemented");
    case "push":
      throw new Error("Not implemented");
    case "status":
      throw new Error("Not implemented");
    case "create":
      throw new Error("Not implemented");
    case "delete":
      throw new Error("Not implemented");
    default:
      const unknownEvent = event as { event_type: string };
      throw new Error(`Unknown event type: ${unknownEvent.event_type}`);
  }
}
