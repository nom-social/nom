import { Json } from "@/types/supabase";

import { processPullRequestReviewEvent } from "./event-processors/pull-request-review";
import { processPullRequestEvent } from "./event-processors/pull-request";
import { processIssueEvent } from "./event-processors/issue";
import { processReleaseEvent } from "./event-processors/release";

// Helper function to process any event type
export async function processEvent(args: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
  currentTimestamp: string;
}) {
  switch (args.event.event_type) {
    case "pull_request":
      return processPullRequestEvent(args);
    case "pull_request_review":
      return processPullRequestReviewEvent(args);
    case "issues":
      return processIssueEvent(args);
    case "release":
      return processReleaseEvent(args);
    default:
      throw new Error(`Unknown event type: ${args.event.event_type}`);
  }
}
