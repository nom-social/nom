import crypto from "crypto";
import { Octokit } from "@octokit/rest";

import { Json, TablesInsert } from "@/types/supabase";
import { createClient } from "@/utils/supabase/background";

import { BASELINE_SCORE, ISSUE_MULTIPLIER } from "./shared/constants";
import { issueSchema } from "./issues/schemas";
import { generateIssueData } from "./issues/utils";

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
  const { issue } = validationResult;

  const octokit = new Octokit({ auth: repo.access_token || undefined });

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
