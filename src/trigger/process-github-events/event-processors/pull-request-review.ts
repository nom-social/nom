import { Octokit } from "@octokit/rest";
import { Json } from "@trigger.dev/sdk";
import { logger } from "@trigger.dev/sdk/v3";
import z from "zod";

import { createClient } from "@/utils/supabase/background";
import { TablesInsert } from "@/types/supabase";

const pullRequestReviewSchema = z.object({
  action: z.enum(["submitted", "edited", "dismissed"]),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    user: z.object({
      login: z.string(),
    }),
    state: z.string(),
    html_url: z.string(),
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string() }),
  }),
  review: z.object({
    id: z.number(),
    state: z.string(),
    user: z.object({ login: z.string(), id: z.number() }),
    body: z.string(),
    html_url: z.string(),
  }),
});

export async function processPullRequestReviewEvent({
  event,
  eventId,
  repo,
  org,
  subscribers,
}: {
  event: Json;
  repo: string;
  org: string;
  subscribers: { user_id: string }[];
  eventId: string;
}): Promise<TablesInsert<"user_timeline">[]> {
  const supabase = createClient();
  const { data: repoData } = await supabase
    .from("repositories")
    .select("*")
    .eq("repo", repo)
    .eq("org", org)
    .single()
    .throwOnError();

  const octokit = new Octokit({ auth: repoData?.access_token });

  const validationResult = pullRequestReviewSchema.parse(event);
  const { action, pull_request, review } = validationResult;

  if (action !== "submitted") return [];

  const timelineEntries: TablesInsert<"user_timeline">[] = [];

  for (const subscriber of subscribers) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", subscriber.user_id)
      .single();

    if (!user) {
      logger.error("User not found", { userId: subscriber.user_id });
      continue;
    }

    // const isMyReview = user.github_username === pull_request.user.login;

    const [prDetails, headCheckRuns] = await Promise.all([
      octokit.pulls.get({
        owner: org,
        repo: repo,
        pull_number: pull_request.number,
      }),
      octokit.checks.listForRef({
        owner: org,
        repo: repo,
        ref: pull_request.head.sha,
      }),
    ]);

    const prStats = {
      pull_request: {
        stats: {
          comments_count: prDetails.data.comments,
          additions: prDetails.data.additions,
          deletions: prDetails.data.deletions,
          changed_files: prDetails.data.changed_files,
        },
        head_checks: {
          total: headCheckRuns.data.total_count,
          passing: headCheckRuns.data.check_runs.filter(
            (check) => check.conclusion === "success"
          ).length,
          failing: headCheckRuns.data.check_runs.filter(
            (check) => check.conclusion === "failure"
          ).length,
        },
        head: { ref: pull_request.head.ref },
        base: { ref: pull_request.base.ref },
        user: { login: pull_request.user.login },
      },
      action,
      review: {
        state: review.state,
        user: { login: review.user.login },
        body: review.body,
        html_url: review.html_url,
      },
    };

    timelineEntries.push({
      user_id: subscriber.user_id,
      type: "pr update",
      data: prStats,
      repo_id: repoData.id,
      score: 100,
      visible_at: new Date().toISOString(),
      event_bucket_ids: [eventId],
    });
  }

  return timelineEntries;
}
