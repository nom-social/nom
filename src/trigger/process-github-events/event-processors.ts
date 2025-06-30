import { Json } from "@/types/supabase";

import { processPullRequestEvent } from "./event-processors/pull-request";
import { processIssueEvent } from "./event-processors/issue";
import { processReleaseEvent } from "./event-processors/release";
import { processIssueCommentEvent } from "./event-processors/issue-comment";

// Helper function to process any event type
export async function processEvent(args: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: {
    repo: string;
    org: string;
    id: string;
    access_token?: string | null;
    settings: Json | null;
  };
  subscribers: { user_id: string }[];
}) {
  switch (args.event.event_type) {
    case "pull_request":
      return processPullRequestEvent(args);
    case "issues":
      return processIssueEvent(args);
    case "issue_comment":
      return processIssueCommentEvent(args);
    case "release":
      return processReleaseEvent(args);
    default:
      throw new Error(`Unknown event type: ${args.event.event_type}`);
  }
}
