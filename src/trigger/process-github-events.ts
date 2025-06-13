import { logger, schedules, wait } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";
import { TablesInsert } from "@/types/supabase";
import { processEvent } from "./process-github-events/event-processors";
import { githubWebhookPayloadSchema } from "@/app/api/webhooks/github/schemas";

// Initialize Supabase client
const supabase = createClient();

// Helper function to calculate event score for timeline ordering
function calculateEventScore() {
  const score = 100;
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

        if (subscribers.length === 0) {
          logger.info("No subscribers found for repository", {
            repoId: repo.id,
          });
          continue;
        }

        // Get the first subscriber's GitHub token for processing the event
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(subscribers[0].user_id);
        const githubToken = user?.app_metadata?.provider_token;

        if (!githubToken) {
          logger.error("No GitHub token found for processing event", {
            eventId: event.id,
          });
          continue;
        }

        // Process the event using the event processor
        const validationResult = githubWebhookPayloadSchema.parse(
          event.raw_payload
        );

        const processedEvent = await processEvent(
          validationResult,
          githubToken
        );

        if (!processedEvent) {
          logger.info("Event was not processed (likely filtered out)", {
            eventId: event.id,
          });
          continue;
        }

        // Check for existing entries to avoid duplicates
        const { data: existingEntries } = await supabase
          .from("user_timeline")
          .select("user_id, event_bucket_ids")
          .in(
            "user_id",
            subscribers.map((s) => s.user_id)
          )
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
            type: processedEvent.type,
            data: processedEvent.data,
            repo_id: repo.id,
            score: calculateEventScore(),
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
