import { z } from "zod";
import crypto from "crypto";

import { logger } from "@trigger.dev/sdk";

import { createAdminClient } from "@/utils/supabase/admin";
import { Json, TablesInsert } from "@/types/supabase";
import { PushData } from "@/components/shared/activity-card/shared/schemas";
import { fetchNomInstructions } from "@/trigger/shared/fetch-nom-template";
import propagateLicenseChange from "@/trigger/shared/propagate-license-changes";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";
import { createEventTools } from "@/trigger/shared/agent-tools";
import { runSummaryAgent } from "@/trigger/shared/run-summary-agent";

import { BASELINE_SCORE } from "./shared/constants";

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
  };
  subscribers: { user_id: string }[];
}): Promise<{
  userTimelineEntries: TablesInsert<"user_timeline">[];
  publicTimelineEntries: TablesInsert<"public_timeline">[];
}> {
  const supabase = createAdminClient();
  const payload = pushEventSchema.parse(event.raw_payload);
  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });

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

  const commitResp = await octokit.repos.getCommit({
    owner: repo.org,
    repo: repo.repo,
    ref: latestCommit.id,
  });
  const changedFileList = commitResp.data.files
    ? commitResp.data.files.map((f) => f.filename).join("\n")
    : "(none)";

  // Propagate license change if LICENSE file was changed in this push event
  await propagateLicenseChange({
    octokit,
    repo,
    ref: latestCommit.id,
  });

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
  const contributors = Array.from(
    new Set(
      payload.commits
        .map((commit) => commit.author.username)
        .filter((username): username is string => Boolean(username))
    )
  );

  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.username || payload.pusher.name;

  const instructions = await fetchNomInstructions({
    eventType: "push",
    repo,
    octokit,
  });

  const context = `Here are the details:
Branch: ${branch}
Pusher: ${pusher}
Contributors: ${contributors.join(", ")}
Commit SHA: ${latestCommit.id}
Commit Messages (latest first):
${commitMessages}

Changed files:
${changedFileList}

You can use explore_file with ref=${latestCommit.id} to read specific file contents, or get_pull_request when a PR number is known from context.`;

  const tools = createEventTools({
    octokit,
    org: repo.org,
    repo: repo.repo,
  });

  const result = await runSummaryAgent({
    instructions,
    context,
    tools,
  });
  if (!result) {
    throw new Error("Failed to parse AI response for push event");
  }

  if (!result.should_post) {
    logger.info("Skipping post (AI decided low impact)", {
      org: repo.org,
      repo: repo.repo,
      eventType: "push",
    });
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };
  }

  const aiSummary = result.summary;

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
      ai_summary: aiSummary,
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
    search_text: [latestCommit.message, aiSummary]
      .filter((text) => text.trim().length > 0)
      .join(" "),
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
