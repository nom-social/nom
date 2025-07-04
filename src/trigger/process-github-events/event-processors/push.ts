import { z } from "zod";
import crypto from "crypto";
import { Octokit } from "@octokit/rest";

import * as openai from "@/utils/openai/client";
import { createClient } from "@/utils/supabase/background";
import { Json, TablesInsert } from "@/types/supabase";
import { PushData } from "@/components/shared/activity-card/shared/schemas";

import { BASELINE_SCORE } from "./shared/constants";
import { PUSH_SUMMARY_PROMPT } from "./push/prompts";
import { getCommitDiff } from "./push/utils";

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

const pushSummaryTemplateSchema = z.object({
  push_summary_template: z.string(),
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
  const openaiClient = openai.createClient();
  const supabase = createClient();
  const payload = pushEventSchema.parse(event.raw_payload);
  const octokit = new Octokit({ auth: repo.access_token });

  // Check if any commit is a merge or squash merge of a PR
  if (
    payload.commits.some((commit) => isMergeOrSquashPRCommit(commit.message))
  ) {
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

  const commitDiff = await getCommitDiff(octokit, repo, latestCommit.id);

  // Format commit messages (latest first)
  const commitMessages = [...payload.commits]
    .reverse()
    .map(
      (commit) =>
        `- ${commit.message.replace(/\n/g, " ")} (${
          commit.author.username || commit.author.name || "unknown"
        })`
    )
    .join("\n");

  // Compose prompt
  const contributors = payload.commits
    .map((commit) => commit.author.username)
    .filter((username): username is string => Boolean(username));

  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.username || payload.pusher.name;
  const pushSummaryTemplate = repo.settings
    ? pushSummaryTemplateSchema.safeParse(repo.settings)
    : null;

  const prompt = (
    pushSummaryTemplate?.data?.push_summary_template || PUSH_SUMMARY_PROMPT
  )
    .replace("{branch}", branch)
    .replace("{pusher}", pusher)
    .replace("{contributors}", contributors.join(", "))
    .replace("{commit_messages}", commitMessages)
    .replace("{commit_diff}", commitDiff || "No changes");

  // Generate AI summary
  const completion = await openaiClient.chat.completions.create({
    model: "o4-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes push events. " +
          "Provide a concise summary as instructed.",
      },
      { role: "user", content: prompt },
    ],
  });

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
      ai_summary: completion.choices[0].message.content || "",
      contributors,
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

  // Batch query all subscriber users at once
  const subscriberIds = subscribers.map((s) => s.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in("id", subscriberIds)
    .throwOnError();

  for (const user of users ?? []) {
    if (
      user.github_username === pusherUsername ||
      commitAuthors.has(user.github_username)
    ) {
      userTimelineEntries.push({
        user_id: user.id,
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
