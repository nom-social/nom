import { logger } from "@trigger.dev/sdk/v3";

import { Json } from "@/types/supabase";

import { processReleaseEvent } from "./event-processors/release";
import { TimelineEvent } from "./event-processors/shared/types";
import { processPullRequestEvent } from "./event-processors/pull-request";
import { processIssueEvent } from "./event-processors/issue";

// Helper function to process any event type
export async function processEvent(args: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
}): Promise<TimelineEvent[]> {
  switch (args.event.event_type) {
    case "pull_request":
      return processPullRequestEvent(args);
    case "issues":
      return processIssueEvent(args);
    case "release":
      return processReleaseEvent(args);
    default:
      logger.error(`Unknown event type: ${args.event.event_type}`);
      return [];
  }
}
