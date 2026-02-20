import { Json } from "@/types/supabase";

import { processPullRequestEvent } from "./event-processors/pull-request";
import { processReleaseEvent } from "./event-processors/release";
import { processPushEvent } from "./event-processors/push";

// Helper function to process any event type
export async function processEvent(args: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: {
    repo: string;
    org: string;
    id: string;
  };
  subscribers: { user_id: string }[];
}) {
  switch (args.event.event_type) {
    case "pull_request":
      return processPullRequestEvent(args);
    case "release":
      return processReleaseEvent(args);
    case "push":
      return processPushEvent(args);
    default:
      throw new Error(`Unknown event type: ${args.event.event_type}`);
  }
}
