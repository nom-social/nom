import { Json } from "@/types/supabase";

// import { processPullRequestReviewEvent } from "./event-processors/pull-request-review";
// import { processIssueEvent } from "./event-processors/issue";
// import { processIssueCommentEvent } from "./event-processors/issue-comment";
import { processReleaseEvent } from "./event-processors/release";
import { TimelineEvent } from "./event-processors/shared/types";
import { processPullRequestEvent } from "./event-processors/pull-request";

// Helper function to process any event type
export async function processEvent(args: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
}): Promise<TimelineEvent[]> {
  switch (args.event.event_type) {
    case "pull_request":
      return processPullRequestEvent(args);
    case "issues":
    // return processIssueEvent(args);
    case "issue_comment":
    // return processIssueCommentEvent(args);
    case "release":
      return processReleaseEvent(args);
    default:
      throw new Error(`Unknown event type: ${args.event.event_type}`);
  }
}
