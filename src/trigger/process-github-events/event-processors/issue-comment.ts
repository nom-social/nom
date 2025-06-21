import { Json } from "@trigger.dev/sdk";
import crypto from "crypto";
import z from "zod";

import { createClient } from "@/utils/supabase/background";
import { TablesInsert } from "@/types/supabase";

import { BASELINE_SCORE, ISSUE_MULTIPLIER } from "./shared/constants";

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
});

export async function processIssueCommentEvent({
  event,
  repo,
  subscribers,
  currentTimestamp,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
  currentTimestamp: string;
}): Promise<TablesInsert<"user_timeline">[]> {
  const supabase = createClient();

  const validationResult = issueCommentSchema.parse(event.raw_payload);
  const { action, issue, comment } = validationResult;

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        action,
        number: issue.number,
        comment_id: comment.id,
        org: repo.org,
        repo: repo.repo,
        type: "issue_comment",
      })
    )
    .digest("hex");

  const issueData = {
    action,
    issue: {
      number: issue.number,
      title: issue.title,
      user: { login: issue.user.login },
      state: issue.state,
      html_url: issue.html_url,
      body: issue.body,
      created_at: issue.created_at.toISOString(),
      assignees: issue.assignees,
    },
    comment: {
      user: { login: comment.user.login },
      body: comment.body,
      html_url: comment.html_url,
      created_at: comment.created_at.toISOString(),
    },
  };

  const timelineEntries: TablesInsert<"user_timeline">[] = [];

  for (const subscriber of subscribers) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", subscriber.user_id)
      .single()
      .throwOnError();

    const isMyIssue = user.github_username === issue.user.login;
    const isAssignedToMe = issue.assignees.some(
      (assignee) => assignee.login === user.github_username
    );
    const isMyComment = user.github_username === comment.user.login;

    timelineEntries.push({
      user_id: subscriber.user_id,
      type: "issue_comment",
      data: issueData,
      repo_id: repo.id,
      score: BASELINE_SCORE * ISSUE_MULTIPLIER,
      categories:
        isMyIssue || isAssignedToMe || isMyComment ? ["issues"] : undefined,
      dedupe_hash: dedupeHash,
      updated_at: currentTimestamp,
      event_ids: [event.id],
      is_read: false,
    });
  }

  return timelineEntries;
}
