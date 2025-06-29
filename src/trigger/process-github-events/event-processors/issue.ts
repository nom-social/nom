import { z } from "zod";
import crypto from "crypto";

import { Json, TablesInsert } from "@/types/supabase";
import { createClient } from "@/utils/supabase/background";

import { BASELINE_SCORE, ISSUE_MULTIPLIER } from "./shared/constants";

const issueSchema = z.object({
  action: z.enum(["opened", "closed", "reopened", "assigned", "edited"]),
  issue: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    state: z.enum(["open", "closed"]),
    user: z.object({ login: z.string() }),
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
    assignee: z.object({ login: z.string() }).nullable(),
    assignees: z.array(z.object({ login: z.string() })),
    labels: z.array(z.object({ name: z.string() })),
    comments: z.number(),
  }),
});

export async function processIssueEvent({
  event,
  repo,
  subscribers,
  currentTimestamp,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token?: string | null };
  subscribers: { user_id: string }[];
  currentTimestamp: string;
}): Promise<{
  userTimelineEntries: TablesInsert<"user_timeline">[];
  publicTimelineEntries: TablesInsert<"public_timeline">[];
}> {
  const supabase = createClient();

  const validationResult = issueSchema.parse(event.raw_payload);
  const { action, issue } = validationResult;

  const issueData = {
    action,
    issue: {
      user: { login: issue.user.login },
      number: issue.number,
      title: issue.title,
      body: issue.body,
      html_url: issue.html_url,
      created_at: issue.created_at.toISOString(),
      assignees: issue.assignees,
      state: issue.state,
    },
  };

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
    score: BASELINE_SCORE * ISSUE_MULTIPLIER,
    repo_id: repo.id,
    dedupe_hash: dedupeHash,
    updated_at: currentTimestamp,
    event_ids: [event.id],
    is_read: false,
  };
  const userTimelineEntries: TablesInsert<"user_timeline">[] = [];

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

    userTimelineEntries.push({
      user_id: subscriber.user_id,
      categories: isMyIssue || isAssignedToMe ? ["issues"] : undefined,
      ...timelineEntry,
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
