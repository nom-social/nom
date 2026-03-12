import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
import { processEvent } from "./process-github-events/event-processors";

export const processGithubEvents = schemaTask({
  id: "process-github-events",
  queue: { name: "process-github-events", concurrencyLimit: 1 },
  schema: z.object({
    org: z.string(),
    repo: z.string(),
  }),
  run: async ({ org, repo }) => {
    const convex = createAdminConvexClient();
    const currentTimestampMs = Date.now();

    // Get unprocessed events for this org/repo
    const events = await convex.query(api.admin.getUnprocessedEvents, {
      org,
      repo,
    });

    logger.info(`Processing ${events.length} events for ${org}/${repo}`);

    // Expire any snoozed timeline entries
    await Promise.allSettled([
      convex.mutation(api.admin.expireSnoozedPublicTimeline, {
        currentTimeMs: currentTimestampMs,
      }),
      convex.mutation(api.admin.expireSnoozedUserTimeline, {
        currentTimeMs: currentTimestampMs,
      }),
    ]);

    for (const event of events) {
      try {
        const repoDoc = await convex.query(api.admin.getRepository, {
          org: event.org,
          repo: event.repo,
        });

        if (!repoDoc) {
          logger.warn("Repository not found for event", { eventId: event._id });
          continue;
        }

        const subscribers = await convex.query(api.admin.getSubscribers, {
          repositoryId: repoDoc._id,
        });

        const processedEventsPerSubscriber = await processEvent({
          event: {
            id: event._id,
            event_type: event.eventType,
            raw_payload: event.rawPayload,
          },
          repo: { id: repoDoc._id, org: repoDoc.org, repo: repoDoc.repo },
          subscribers: subscribers.map((s) => ({ user_id: s.userId })),
        });

        // Entries are already in camelCase Convex format; just fix the repositoryId type
        const userTimelineEntries =
          processedEventsPerSubscriber.userTimelineEntries.map((entry) => ({
            ...entry,
            repositoryId: repoDoc._id,
          }));

        const publicTimelineEntries =
          processedEventsPerSubscriber.publicTimelineEntries.map((entry) => ({
            ...entry,
            repositoryId: repoDoc._id,
          }));

        await Promise.allSettled([
          convex.mutation(api.admin.upsertUserTimelineEntries, {
            entries: userTimelineEntries as Parameters<
              typeof convex.mutation<typeof api.admin.upsertUserTimelineEntries>
            >[1]["entries"],
          }),
          convex.mutation(api.admin.upsertPublicTimelineEntries, {
            entries: publicTimelineEntries as Parameters<
              typeof convex.mutation<typeof api.admin.upsertPublicTimelineEntries>
            >[1]["entries"],
          }),
        ]);
      } catch (error) {
        logger.error("Error processing event", { error, eventId: event._id });
      } finally {
        await convex.mutation(api.admin.markEventProcessed, {
          eventId: event._id,
        });
      }
    }

    logger.info("Finished processing GitHub events");
  },
});
