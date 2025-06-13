import { logger, schedules, wait } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";

import { processEvent } from "./process-github-events/event-processors";

// Initialize Supabase client
const supabase = createClient();

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

        const processedEventsPerSubscriber = await processEvent({
          event: event.raw_payload,
          eventId: event.id,
          repo,
          subscribers,
        });

        // Create timeline entries for each subscriber
        await supabase
          .from("user_timeline")
          .upsert(processedEventsPerSubscriber, {
            onConflict: "user_id,event_bucket_ids",
          })
          .throwOnError();

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
