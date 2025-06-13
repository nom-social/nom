import { logger, schedules, wait } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";
import { TablesInsert } from "@/types/supabase";

import { processEvent } from "./process-github-events/event-processors";

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

        const { data: repoData } = await supabase
          .from("repositories")
          .select("access_token")
          .eq("repo", event.repo)
          .eq("org", event.org)
          .single();

        const processedEvent = await processEvent({
          event: event.raw_payload,
          githubToken: repoData?.access_token || undefined,
          repo: event.repo,
          org: event.org,
        });

        // TODO: Also include which category this belongs to (e.g. pull requests, issues, releases)
        // this depends on whether this PR involves me or not
        // TODO: Maybe pass the user id / login down to the event processor
        // so we can handle it there instead of here

        if (!processedEvent) {
          logger.info("Event was not processed (likely filtered out)", {
            eventId: event.id,
          });
          continue;
        }

        // Create timeline entries for each subscriber
        const timelineEntries = (subscribers || []).map<
          TablesInsert<"user_timeline">
        >((subscriber) => ({
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
            .upsert(timelineEntries, { onConflict: "user_id,event_bucket_ids" })
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
