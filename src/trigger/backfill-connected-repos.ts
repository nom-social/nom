import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import {
  fetchAndEnrichRepoEvents,
  FILTERABLE_EVENT_TYPES,
} from "@/lib/backfill/events-api";
import { processGithubEvents } from "@/trigger/process-github-events";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";
import { createAdminClient } from "@/utils/supabase/admin";

export const backfillConnectedReposTask = schemaTask({
  id: "backfill-connected-repos",
  schema: z.object({
    repos: z.array(z.object({ org: z.string(), repo: z.string() })),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  run: async ({ repos, limit }) => {
    const supabase = createAdminClient();

    for (const { org, repo } of repos) {
      try {
        logger.info("Starting initial backfill for connected repo", {
          org,
          repo,
        });
        const octokit = await createAuthenticatedOctokitClient({ org, repo });
        const events = await fetchAndEnrichRepoEvents(
          octokit,
          org,
          repo,
          limit,
          FILTERABLE_EVENT_TYPES,
        );

        if (events.length === 0) {
          logger.info("No events found during initial backfill", { org, repo });
          continue;
        }

        const rows = events.map((event) => ({
          event_type: event.event_type,
          action: event.action,
          org: event.org,
          repo: event.repo,
          raw_payload: event.raw_payload,
          created_at: event.created_at,
        }));

        await supabase.from("github_event_log").insert(rows).throwOnError();
        logger.info("Inserted backfill events for connected repo", {
          org,
          repo,
          events: rows.length,
        });

        await processGithubEvents.trigger(
          { org, repo },
          { concurrencyKey: org },
        );
      } catch (error) {
        logger.error("Failed to backfill connected repo", { org, repo, error });
      }
    }
  },
});
