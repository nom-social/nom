import { Octokit } from "@octokit/rest";
import { Json } from "@trigger.dev/sdk";
import crypto from "crypto";
import z from "zod";

import { createClient } from "@/utils/supabase/background";
import { TablesInsert } from "@/types/supabase";

import {
  BASELINE_SCORE,
  PULL_REQUEST_REVIEW_MULTIPLIER,
} from "./shared/constants";

const pullRequestReviewSchema = z.object({
  action: z.enum(["submitted", "edited"]),
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
    body: z.string().nullable(),
    created_at: z.coerce.date(),
  }),
  review: z.object({
    id: z.number(),
    state: z.string(),
    user: z.object({ login: z.string(), id: z.number() }),
    body: z.string().nullable(),
    html_url: z.string(),
    submitted_at: z.coerce.date(),
  }),
});

export async function processPullRequestReviewEvent({
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

  const octokit = new Octokit({ auth: repo.access_token || undefined });

  const validationResult = pullRequestReviewSchema.parse(event.raw_payload);
  const { action, pull_request, review } = validationResult;

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        action,
        number: pull_request.number,
        org: repo.org,
        repo: repo.repo,
        type: "pull_request_review",
        review_id: review.id,
      })
    )
    .digest("hex");

  const timelineEntries: TablesInsert<"user_timeline">[] = [];

  for (const subscriber of subscribers) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", subscriber.user_id)
      .single()
      .throwOnError();

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

    const isMyReview = user.github_username === pull_request.user.login;
    const isReviewAssignedToMe =
      !!prDetails.data.requested_reviewers?.some(
        (reviewer) => reviewer.login === user.github_username
      ) || user.github_username === review.user.login;

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
        html_url: pull_request.html_url,
        number: pull_request.number,
        title: pull_request.title,
        body: pull_request.body,
        created_at: pull_request.created_at.toISOString(),
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
      score: BASELINE_SCORE * PULL_REQUEST_REVIEW_MULTIPLIER,
      categories:
        isMyReview || isReviewAssignedToMe ? ["pull_requests"] : undefined,
      dedupe_hash: dedupeHash,
      updated_at: currentTimestamp,
      event_ids: [event.id],
      is_read: false,
    });
  }

  return timelineEntries;
}
