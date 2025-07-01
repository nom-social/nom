import { z } from "zod";
import crypto from "crypto";

import { createClient } from "@/utils/supabase/background";
import { Json, TablesInsert } from "@/types/supabase";

import { BASELINE_SCORE } from "./shared/constants";
import { PushData } from "@/components/shared/activity-cards/shared/schemas";

// Define the schema for push events
const pushEventSchema = z.object({
  ref: z.string(),
  before: z.string(),
  after: z.string(),
  created: z.boolean().optional(),
  deleted: z.boolean().optional(),
  forced: z.boolean().optional(),
  base_ref: z.string().nullable().optional(),
  compare: z.string().optional(),
  commits: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      timestamp: z.string(),
      url: z.string(),
      author: z.object({
        name: z.string(),
        email: z.string(),
        username: z.string().optional(),
      }),
    })
  ),
  head_commit: z
    .object({
      id: z.string(),
      message: z.string(),
      timestamp: z.string(),
      url: z.string(),
      author: z.object({
        name: z.string(),
        email: z.string(),
        username: z.string().optional(),
      }),
    })
    .nullable()
    .optional(),
  pusher: z.object({
    name: z.string(),
    email: z.string(),
    username: z.string().optional(),
  }),
});

// Helper: Detect if a commit message is a merge or squash merge of a PR
function isMergeOrSquashPRCommit(message: string): boolean {
  // Standard merge commit: "Merge pull request #123 from ..."
  if (/^Merge pull request #(\d+) /i.test(message)) return true;
  // Squash merge: "Some PR title (#123)" (at end of message)
  if (/\(#\d+\)$/.test(message.trim().split("\n")[0])) return true;
  return false;
}

export async function processPushEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: {
    repo: string;
    org: string;
    id: string;
    access_token?: string | null;
    settings: Json | null;
  };
  subscribers: { user_id: string }[];
}): Promise<{
  userTimelineEntries: TablesInsert<"user_timeline">[];
  publicTimelineEntries: TablesInsert<"public_timeline">[];
}> {
  const payload = pushEventSchema.parse(event.raw_payload);
  const supabase = createClient();

  // Check if any commit is a merge or squash merge of a PR
  const hasMergedPRCommit = payload.commits.some((commit) =>
    isMergeOrSquashPRCommit(commit.message)
  );
  if (hasMergedPRCommit) {
    // Skip posting this push event
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };
  }

  // Use the last commit as the latest (commits are sorted oldest to newest)
  const latestCommit = payload.commits[payload.commits.length - 1];
  if (!latestCommit) {
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };
  }

  // Generate dedupe hash similar to pull-request.ts
  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        org: repo.org,
        repo: repo.repo,
        after: payload.after,
        type: "push",
      })
    )
    .digest("hex");

  const latestTimestamp = new Date(latestCommit.timestamp).toISOString();

  const pushData: PushData = {
    push: {
      ai_summary: "",
      contributors: payload.commits
        .map((commit) => commit.author.username)
        .filter((username): username is string => Boolean(username)),
      title: latestCommit.message,
      html_url: latestCommit.url,
      created_at: latestTimestamp,
    },
  };

  const timelineEntry = {
    type: "push",
    data: pushData,
    score: BASELINE_SCORE,
    repo_id: repo.id,
    dedupe_hash: dedupeHash,
    updated_at: latestTimestamp,
    event_ids: [event.id],
    is_read: false,
  };

  // Find involved users: pusher or commit author
  const commitAuthors = new Set(
    payload.commits
      .map((commit) => commit.author.username)
      .filter((username): username is string => Boolean(username))
  );
  const pusherUsername = payload.pusher.username;

  const userTimelineEntries: TablesInsert<"user_timeline">[] = [];
  for (const subscriber of subscribers) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", subscriber.user_id)
      .single()
      .throwOnError();

    // Check if user is pusher or commit author
    if (
      user.github_username === pusherUsername ||
      commitAuthors.has(user.github_username)
    ) {
      userTimelineEntries.push({
        user_id: subscriber.user_id,
        categories: ["pushes"],
        ...timelineEntry,
      });
    }
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
