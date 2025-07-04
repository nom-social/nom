import crypto from "crypto";
import z from "zod";

import { createClient } from "@/utils/supabase/background";
import { Json, TablesInsert } from "@/types/supabase";

import { generateIssueData } from "./issues/utils";
import { BASELINE_SCORE, ISSUE_MULTIPLIER } from "./shared/constants";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";

const issueCommentSchema = z.object({
  action: z.enum(["created", "edited"]),
  issue: z.object({
    number: z.number(),
    title: z.string(),
    user: z.object({ login: z.string() }),
    state: z.enum(["open", "closed"]),
    html_url: z.string(),
    body: z.string().nullable(),
    created_at: z.coerce.date(),
    assignees: z.array(z.object({ login: z.string() })),
    author_association: z.enum([
      "COLLABORATOR",
      "CONTRIBUTOR",
      "FIRST_TIMER",
      "FIRST_TIME_CONTRIBUTOR",
      "MANNEQUIN",
      "MEMBER",
      "NONE",
      "OWNER",
    ]),
  }),
  comment: z.object({
    id: z.number(),
    user: z.object({ login: z.string() }),
    body: z.string(),
    html_url: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    author_association: z.enum([
      "COLLABORATOR",
      "CONTRIBUTOR",
      "FIRST_TIMER",
      "FIRST_TIME_CONTRIBUTOR",
      "MANNEQUIN",
      "MEMBER",
      "NONE",
      "OWNER",
    ]),
  }),
  sender: z.object({ type: z.enum(["User"]) }),
});

export async function processIssueCommentEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: {
    repo: string;
    org: string;
    id: string;
    settings: Json | null;
    access_token?: string | null;
  };
  subscribers: { user_id: string }[];
}): Promise<{
  userTimelineEntries: TablesInsert<"user_timeline">[];
  publicTimelineEntries: TablesInsert<"public_timeline">[];
}> {
  const supabase = createClient();

  const validationResult = issueCommentSchema.parse(event.raw_payload);
  const { action, issue, comment } = validationResult;

  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });

  const issueData = await generateIssueData({
    octokit,
    repo,
    action,
    issue: {
      ...issue,
      updated_at: new Date(comment.updated_at),
    },
  });

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        number: issue.number,
        org: repo.org,
        repo: repo.repo,
        type: "issue",
      })
    )
    .digest("hex");

  const timelineEntry = {
    type: "issue",
    data: issueData,
    repo_id: repo.id,
    score: BASELINE_SCORE * ISSUE_MULTIPLIER,
    dedupe_hash: dedupeHash,
    updated_at: comment.updated_at.toISOString(),
    event_ids: [event.id],
    is_read: false,
  };
  const userTimelineEntries: TablesInsert<"user_timeline">[] = [];

  // Batch query all subscriber users at once
  const subscriberIds = subscribers.map((s) => s.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in("id", subscriberIds)
    .throwOnError();

  for (const user of users ?? []) {
    const isMyIssue = user.github_username === issue.user.login;
    const isAssignedToMe = issue.assignees.some(
      (assignee) => assignee.login === user.github_username
    );
    const isMyComment =
      validationResult.comment?.user?.login === user.github_username;

    userTimelineEntries.push({
      user_id: user.id,
      categories:
        isMyIssue || isAssignedToMe || isMyComment ? ["issues"] : undefined,
      ...timelineEntry,
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
