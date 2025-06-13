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
    submitted_at: z.coerce.date(),
  }),
});

export async function processPullRequestReviewEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
}): Promise<TablesInsert<"user_timeline">[]> {
  const supabase = createClient();

  const octokit = new Octokit({ auth: repo.access_token || undefined });

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

    const isMyReview =
      user.github_username === pull_request.user.login ||
      user.github_username === review.user.login;

    const [prDetails, headCheckRuns] = await Promise.all([
      octokit.pulls.get({
        owner: repo.org,
        repo: repo.repo,
        pull_number: pull_request.number,
      }),
      octokit.checks.listForRef({
        owner: repo.org,
        repo: repo.repo,
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
        submitted_at: review.submitted_at.toISOString(),
      },
    };

    timelineEntries.push({
      user_id: subscriber.user_id,
      type: "pr update",
      data: prStats,
      repo_id: repo.id,
      score: 100, // TODO: calculate score based on review and pr stats
      visible_at: new Date().toISOString(),
      event_bucket_ids: [event.id],
      categories: isMyReview ? ["pull_requests"] : undefined,
    });
  }

  return timelineEntries;
}
