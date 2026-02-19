import { logger, task, wait } from "@trigger.dev/sdk";

import { createAdminClient } from "@/utils/supabase/admin";

import { processEvent } from "./process-github-events/event-processors";

export const processGithubEvents = task({
  id: "process-github-events",
  maxDuration: 300,
  queue: { name: "process-github-events", concurrencyLimit: 1 },
  run: async () => {
    const supabase = createAdminClient();
    const currentTimestamp = new Date().toISOString();

    // Get unprocessed events
    const { data: events } = await supabase
      .from("github_event_log")
      .select("*")
      .is("last_processed", null)
      .order("created_at", { ascending: true })
      .throwOnError();

    logger.info(`Processing ${events.length} events`);

    // First, handle any snoozed timeline entries that have reached their time
    await Promise.allSettled([
      supabase
        .from("user_timeline")
        .update({ snooze_to: null, updated_at: currentTimestamp })
        .not("snooze_to", "is", null)
        .lt("snooze_to", currentTimestamp)
        .throwOnError(),
      supabase
        .from("public_timeline")
        .update({ snooze_to: null, updated_at: currentTimestamp })
        .not("snooze_to", "is", null)
        .lt("snooze_to", currentTimestamp)
        .throwOnError(),
    ]);

    for (const event of events || []) {
      try {
        const { data: repo } = await supabase
          .from("repositories")
          .select("id, repo, org")
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

        const processedEventsPerSubscriber = await processEvent({
          event,
          repo,
          subscribers,
        });

        // Create timeline entries for each subscriber and general feed
        await Promise.allSettled([
          supabase
            .from("user_timeline")
            .upsert(processedEventsPerSubscriber.userTimelineEntries, {
              onConflict: "user_id,dedupe_hash",
            })
            .throwOnError(),
          supabase
            .from("public_timeline")
            .upsert(processedEventsPerSubscriber.publicTimelineEntries, {
              onConflict: "dedupe_hash",
            })
            .throwOnError(),
        ]);

        // Add a small delay between processing each event to avoid overwhelming the database
        await wait.for({ seconds: 1 });
      } catch (error) {
        logger.error("Error processing event", { error, eventId: event.id });
      }
    }

    // Mark events as processed
    await supabase
      .from("github_event_log")
      .update({ last_processed: currentTimestamp })
      .in(
        "id",
        events.map((event) => event.id)
      )
      .throwOnError();

    logger.info("Finished processing GitHub events");
  },
});
