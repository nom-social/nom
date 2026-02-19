#!/usr/bin/env node
/**
 * Backfill script: fetch events from dedicated GitHub API endpoints for a public repo,
 * insert into github_event_log with correct timestamps, then trigger process-github-events.
 *
 * Uses commits, pulls, and releases APIs directly (not the
 * Events API), so you get the events you want even when a repo is flooded with stars/comments.
 *
 * Usage:
 *   npm run backfill:repo -- octocat/Hello-World --types push,pull_request,release
 *   npm run backfill:repo -- octocat/Hello-World --types push --limit 10 --dry-run
 *
 * Options:
 *   --types (required) push,pull_request,release
 *     Comma-separated list of event types to backfill.
 *
 * Env:
 *   GITHUB_TOKEN (optional) - PAT for higher rate limits (5000/hr vs 60/hr unauthenticated)
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - required for DB
 *   TRIGGER_SECRET_KEY - required to trigger process-github-events (or run trigger dev)
 */

import { Octokit } from "@octokit/rest";

import { createAdminClient } from "@/utils/supabase/admin";
import { processGithubEvents } from "@/trigger/process-github-events";

import { ensurePublicRepo } from "./utils/ensure-repo";
import {
  fetchAndEnrichRepoEvents,
  FILTERABLE_EVENT_TYPES,
  type EnrichedEventForInsert,
} from "./utils/events-api";

function parseArgs(): {
  org: string;
  repo: string;
  limit: number;
  dryRun: boolean;
  types: string[];
} {
  const args = process.argv.slice(2);
  let org = "";
  let repo = "";
  let limit = 20;
  let dryRun = false;
  let types: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--org" && args[i + 1]) {
      org = args[++i]!;
    } else if (arg === "--repo" && args[i + 1]) {
      repo = args[++i]!;
    } else if (arg === "--limit" && args[i + 1]) {
      limit = Math.min(parseInt(args[++i]!, 10) || 20, 100);
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--types" && args[i + 1]) {
      const raw = args[++i]!.trim();
      types = raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const validSet = new Set<string>(FILTERABLE_EVENT_TYPES);
      const invalid = types.filter((t) => !validSet.has(t));
      if (invalid.length > 0) {
        console.error(
          `Invalid --types: ${invalid.join(", ")}. Valid: ${FILTERABLE_EVENT_TYPES.join(", ")}`
        );
        process.exit(1);
      }
    } else if (!arg.startsWith("-") && arg.includes("/")) {
      const [o, r] = arg.split("/");
      if (o && r) {
        org = o;
        repo = r;
      }
    }
  }

  if (!org || !repo) {
    console.error(
      "Usage: backfill-repo-events OWNER/REPO --types push,pull_request,release [--limit N] [--dry-run]"
    );
    process.exit(1);
  }

  if (types.length === 0) {
    console.error(
      "--types is required. Example: --types push,pull_request,release"
    );
    process.exit(1);
  }

  return { org, repo, limit, dryRun, types };
}

async function main() {
  const { org, repo, limit, dryRun, types } = parseArgs();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || undefined,
  });

  if (!process.env.GITHUB_TOKEN) {
    console.warn(
      "No GITHUB_TOKEN set. Using unauthenticated API (60 req/hr). Consider setting GITHUB_TOKEN for reliable backfill."
    );
  }

  console.log(`Ensuring repo ${org}/${repo} exists...`);
  await ensurePublicRepo({ org, repo });

  console.log(
    `Fetching up to ${limit} events (types: ${types.join(", ")}) from dedicated APIs...`
  );
  const enrichedEvents = await fetchAndEnrichRepoEvents(
    octokit,
    org,
    repo,
    limit,
    types
  );

  if (enrichedEvents.length === 0) {
    console.log("No supported events found.");
    return;
  }

  console.log(`Found ${enrichedEvents.length} supported events.`);

  if (dryRun) {
    console.log("Dry run - would insert:");
    for (const e of enrichedEvents) {
      console.log(`  - ${e.event_type} ${e.action ?? ""} (${e.created_at})`);
    }
    return;
  }

  const supabase = createAdminClient();

  const rows: Array<{
    event_type: string;
    action: string | null;
    org: string;
    repo: string;
    raw_payload: EnrichedEventForInsert["raw_payload"];
    created_at: string;
  }> = enrichedEvents.map((e) => ({
    event_type: e.event_type,
    action: e.action,
    org: e.org,
    repo: e.repo,
    raw_payload: e.raw_payload,
    created_at: e.created_at,
  }));

  const { error } = await supabase.from("github_event_log").insert(rows);

  if (error) {
    console.error("Failed to insert events:", error);
    process.exit(1);
  }

  console.log(
    `Inserted ${rows.length} events. Triggering process-github-events...`
  );

  try {
    await processGithubEvents.trigger();
    console.log("Trigger invoked successfully.");
  } catch (err) {
    console.error("Failed to trigger process-github-events:", err);
    console.warn(
      "Events are in github_event_log. Run the trigger manually if needed."
    );
    process.exit(1);
  }
}

main();
