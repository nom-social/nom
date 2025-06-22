import { logger, schedules, wait } from "@trigger.dev/sdk/v3";
import * as R from "remeda";

import { createClient } from "@/utils/supabase/background";

import { processEvent } from "./tweet-github-events/event-processors";

// Initialize Supabase client
const supabase = createClient();

export const tweetGithubEvents = schedules.task({
  id: "tweet-github-events",
  // Run every hour
  cron: "0 * * * *",
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

        const { data: repo } = await supabase
          .from("repositories")
          .select("*")
          .eq("repo", event.repo)
          .eq("org", event.org)
          .single()
          .throwOnError();

        const timelineEntries = await processEvent({
          event,
          repo,
        });

        const uniqueTimelineEntries = R.uniqueBy(
          timelineEntries,
          (data) => data.dedupeHash
        );

        // TODO: Schedule an outgoing task (with a delay) to tweet the timeline entries
        logger.info(
          `Found ${uniqueTimelineEntries.length} unique timeline entries`
        );

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
