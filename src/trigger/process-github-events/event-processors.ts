import { Json } from "@/types/supabase";

import { processPullRequestReviewEvent } from "./event-processors/pull-request-review";
import { processPullRequestEvent } from "./event-processors/pull-request";

// Helper function to process any event type
export async function processEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
}) {
  switch (event.event_type) {
    case "pull_request":
      return processPullRequestEvent({
        event,
        repo,
        subscribers,
      });
    case "pull_request_review":
      return processPullRequestReviewEvent({
        event,
        repo,
        subscribers,
      });
    case "pull_request_review_comment":
      throw new Error("Not implemented");
    case "issues":
      throw new Error("Not implemented");
    case "release":
      throw new Error("Not implemented");
    case "issue_comment":
      throw new Error("Not implemented");
    case "star":
      throw new Error("Not implemented");
    default:
      const unknownEvent = event as { event_type: string };
      throw new Error(`Unknown event type: ${unknownEvent.event_type}`);
  }
}
