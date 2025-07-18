import z from "zod";
import crypto from "crypto";

import { Json, TablesInsert } from "@/types/supabase";
import { createClient } from "@/utils/supabase/background";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";

import { BASELINE_SCORE, ISSUE_MULTIPLIER } from "./shared/constants";
import { generateIssueData } from "./issues/utils";

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
  const supabase = createClient();

  const validationResult = issueSchema.parse(event.raw_payload);
  const { issue } = validationResult;

  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });

  const issueData = await generateIssueData({
    octokit,
    repo,
    action: validationResult.action,
    issue,
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
    score: BASELINE_SCORE * ISSUE_MULTIPLIER,
    repo_id: repo.id,
    dedupe_hash: dedupeHash,
    updated_at: issue.updated_at.toISOString(),
    event_ids: [event.id],
    is_read: false,
    search_text: [issueData.issue.title, issueData.issue.ai_summary]
      .filter((text) => text.trim().length > 0)
      .join(" "),
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

    userTimelineEntries.push({
      user_id: user.id,
      categories: isMyIssue || isAssignedToMe ? ["issues"] : undefined,
      ...timelineEntry,
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
