import { logger, schedules, wait } from "@trigger.dev/sdk/v3";

import { createClient } from "@/utils/supabase/background";

// Initialize Supabase client
const supabase = createClient();

export const tweetGithubEvents = schedules.task({
  id: "tweet-github-events",
  // Run every 5 minutes
  cron: "*/1 * * * *",
  maxDuration: 300, // 5 minutes max runtime
  run: async (payload) => {
    const currentTimestamp = new Date().toISOString();

    logger.info("Starting GitHub event tweet", {
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

    logger.info(`Found ${events.length} unprocessed events`);

    for (const event of events || []) {
      try {
        // Log the event details
        logger.info("Processing GitHub event", {
          eventId: event.id,
          org: event.org,
          repo: event.repo,
          eventType: event.event_type,
          createdAt: event.created_at,
        });

        // Mark event as processed
        await supabase
          .from("github_event_log")
          .update({ last_processed: currentTimestamp })
          .eq("id", event.id)
          .throwOnError();

        // Add a small delay between processing each event to avoid overwhelming the database
        await wait.for({ seconds: 1 });
      } catch (error) {
        logger.error("Error processing event", { error, eventId: event.id });
      }
    }

    logger.info("Finished logging GitHub events");
  },
});
