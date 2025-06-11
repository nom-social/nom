import { logger, schedules, wait } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";
import { Database, TablesInsert } from "@/types/supabase";

// Initialize Supabase client
const supabase = createClient();

// Helper function to calculate event score for timeline ordering
function calculateEventScore(
  event: Database["public"]["Tables"]["github_event_log"]["Row"]
) {
  // base score
  let score = 100;
  const eventTime = new Date(event.created_at).getTime();
  const now = Date.now();
  const timeScore = Math.floor((now - eventTime) / 1000); // Convert to seconds
  score += timeScore;

  return score;
}

// TODO: We also need to generate a unique slug for the event
export const processGithubEvents = schedules.task({
  id: "process-github-events",
  // Run every 5 minutes
  cron: "*/5 * * * *",
  maxDuration: 300, // 5 minutes max runtime
  run: async (payload) => {
    logger.info("Starting GitHub event processing", {
      timestamp: payload.timestamp,
      timezone: payload.timezone,
    });

    // Get unprocessed events
    const { data: events } = await supabase
      .from("github_event_log")
      .select("*")
      .is("last_processed", null)
      .order("created_at", { ascending: true })
      .limit(100)
      .throwOnError();

    logger.info(`Processing ${events.length} events`);

    for (const event of events || []) {
      try {
        const { data: repo } = await supabase
          .from("repositories")
          .select("*")
          .eq("repo", event.repo)
          .eq("org", event.org)
          .single()
          .throwOnError();

        // Find subscribers for this repository
        const { data: subscribers } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("repo_id", repo.id)
          .throwOnError();

        // Check for existing entries to avoid duplicates
        const { data: existingEntries } = await supabase
          .from("user_timeline")
          .select("user_id, event_bucket_ids")
          .in("user_id", subscribers.map((s) => s.user_id) || [])
          .filter("event_bucket_ids", "cs", `{${event.id}}`)
          .throwOnError();

        // Create a set of user_ids that already have this event
        const existingUserIds = new Set(
          existingEntries.map((entry) => entry.user_id)
        );

        // Create timeline entries for each subscriber, excluding those that already have the event
        const timelineEntries = (subscribers || [])
          .filter((subscriber) => !existingUserIds.has(subscriber.user_id))
          .map<TablesInsert<"user_timeline">>((subscriber) => ({
            user_id: subscriber.user_id,
            type: "github_event",
            data: {
              event_type: event.event_type,
              action: event.action,
              content: "HELLO WORLD", // TODO: We need to decide on the type of data
            },
            repo_id: repo.id,
            score: calculateEventScore(event),
            visible_at: new Date().toISOString(),
            event_bucket_ids: [event.id],
          }));

        if (timelineEntries.length > 0) {
          await supabase
            .from("user_timeline")
            .insert(timelineEntries)
            .throwOnError();
        }

        // Mark event as processed
        await supabase
          .from("github_event_log")
          .update({ last_processed: new Date().toISOString() })
          .eq("id", event.id)
          .throwOnError();

        // Add a small delay between processing each event to avoid overwhelming the database
        await wait.for({ seconds: 1 });
      } catch (error) {
        logger.error("Error processing event", { error, eventId: event.id });
      }
    }

    logger.info("Finished processing GitHub events");
  },
});
