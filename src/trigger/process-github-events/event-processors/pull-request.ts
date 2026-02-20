import { z } from "zod";
import crypto from "crypto";
import { logger } from "@trigger.dev/sdk";

import { createAdminClient } from "@/utils/supabase/admin";
import { Json, TablesInsert } from "@/types/supabase";
import { PrData } from "@/components/shared/activity-card/shared/schemas";
import { fetchNomInstructions } from "@/trigger/shared/fetch-nom-template";
import propagateLicenseChange from "@/trigger/shared/propagate-license-changes";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";
import { createEventTools } from "@/trigger/shared/agent-tools";
import { runSummaryAgent } from "@/trigger/shared/run-summary-agent";

import { BASELINE_SCORE, PULL_REQUEST_MULTIPLIER } from "./shared/constants";

const pullRequestSchema = z.object({
  action: z.enum(["closed"]),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    merged: z.boolean(),
    draft: z.boolean().optional(),
    requested_reviewers: z.array(z.object({ login: z.string() })).optional(),
    assignees: z.array(z.object({ login: z.string() })).optional(),
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
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string() }),
    comments: z.number(),
    additions: z.number(),
    deletions: z.number(),
    changed_files: z.number(),
    review_comments: z.number(),
    labels: z.array(z.object({ name: z.string() })),
  }),
});

export async function processPullRequestEvent({
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
  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });
  const supabase = createAdminClient();

  const validationResult = pullRequestSchema.parse(event.raw_payload);
  const { action, pull_request } = validationResult;

  const constructPRData = async () => {
    const [files, checks, commits, reviews] = await Promise.all([
      octokit.pulls.listFiles({
        owner: repo.org,
        repo: repo.repo,
        pull_number: pull_request.number,
      }),
      octokit.checks.listForRef({
        owner: repo.org,
        repo: repo.repo,
        ref: pull_request.head.sha,
      }),
      octokit.pulls.listCommits({
        owner: repo.org,
        repo: repo.repo,
        pull_number: pull_request.number,
      }),
      octokit.pulls.listReviews({
        owner: repo.org,
        repo: repo.repo,
        pull_number: pull_request.number,
      }),
    ]);

    // Format commit messages
    const commitMessages = commits.data
      .map(
        (commit) =>
          `- ${commit.commit.message} (${commit.author?.login || "unknown"})`
      )
      .join("\n");
    const commitMessagesText = `Commit Messages (latest first):\n${commitMessages}`;

    // Format reviews
    const reviewSummaries = reviews.data
      .map(
        (review) =>
          `- ${review.user?.login || "unknown"} [${review.state}]: ${
            review.body ? review.body.substring(0, 200) : "No comment"
          }`
      )
      .join("\n");
    const reviewsText = `Pull Request Reviews:\n${reviewSummaries}`;

    const checksStatus = {
      total: checks.data.total_count,
      passed: checks.data.check_runs.filter((c) => c.conclusion === "success")
        .length,
      failed: checks.data.check_runs.filter((c) => c.conclusion === "failure")
        .length,
      pending: checks.data.check_runs.filter(
        (c) => c.status === "in_progress" || c.status === "queued"
      ).length,
    };

    const checksStatusText =
      "Total Checks: " +
      checksStatus.total +
      "\n" +
      "Passed: " +
      checksStatus.passed +
      "\n" +
      "Failed: " +
      checksStatus.failed +
      "\n" +
      "Pending: " +
      checksStatus.pending +
      "\n\n" +
      "Failed Checks:\n" +
      checks.data.check_runs
        .filter((c) => c.conclusion === "failure")
        .map(
          (c) =>
            "- " + c.name + ": " + (c.output?.summary || "No details available")
        )
        .join("\n") +
      "\n\n" +
      "Pending Checks:\n" +
      checks.data.check_runs
        .filter((c) => c.status === "in_progress" || c.status === "queued")
        .map((c) => "- " + c.name)
        .join("\n");

    const changedFileList = files.data.map((f) => f.filename).join("\n");

    const instructions = await fetchNomInstructions({
      eventType: "pull_request",
      repo,
      octokit,
    });

    const context = `Here is the pull request information:
Title: ${pull_request.title}
Author: ${pull_request.user.login}
Author Association: ${pull_request.author_association}
Description: ${pull_request.body || "No description provided"}

Stats:
- Files changed: ${pull_request.changed_files}
- Additions: ${pull_request.additions}
- Deletions: ${pull_request.deletions}
- Labels: ${pull_request.labels.map((l) => l.name).join(", ")}

Checks status:
${checksStatusText}

Changed files:
${changedFileList || "(none)"}

${commitMessagesText}

${reviewsText}

You can use explore_file with ref=${pull_request.head.sha} to read specific file contents, or get_pull_request with pull_number=${pull_request.number} for full PR details including diff.`;

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
      throw new Error("Failed to parse AI response for pull request");
    }

    if (!result.should_post) {
      logger.info("Skipping post (AI decided low impact)", {
        org: repo.org,
        repo: repo.repo,
        eventType: "pull_request",
        prNumber: pull_request.number,
      });
      return null;
    }

    const ai_summary = result.summary;

    const prData: PrData = {
      action,
      pull_request: {
        stats: {
          comments_count: pull_request.comments,
          additions: pull_request.additions,
          deletions: pull_request.deletions,
          changed_files: pull_request.changed_files,
        },
        head_checks: {
          total: checks.data.total_count,
          passing: checks.data.check_runs.filter(
            (check) => check.conclusion === "success"
          ).length,
          failing: checks.data.check_runs.filter(
            (check) => check.conclusion === "failure"
          ).length,
        },
        head: { ref: pull_request.head.ref },
        base: { ref: pull_request.base.ref },
        user: { login: pull_request.user.login },
        number: pull_request.number,
        title: pull_request.title,
        body: pull_request.body,
        html_url: pull_request.html_url,
        created_at: pull_request.created_at.toISOString(),
        updated_at: pull_request.updated_at.toISOString(),
        ai_summary,
        requested_reviewers: pull_request.requested_reviewers,
        merged: pull_request.merged,
        contributors: [
          ...new Set([
            pull_request.user.login,
            ...commits.data
              .map((commit) => commit.author?.login)
              .filter((login): login is string => Boolean(login)),
            ...(pull_request.assignees?.map((assignee) => assignee.login) ||
              []),
            ...(pull_request.requested_reviewers?.map(
              (reviewer) => reviewer.login
            ) || []),
          ]),
        ],
      },
    };

    return prData;
  };

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        number: pull_request.number,
        org: repo.org,
        repo: repo.repo,
        type: "pull_request",
      })
    )
    .digest("hex");

  if (!pull_request.merged)
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };

  // Propagate license change if LICENSE file was changed in this PR's merge commit
  await propagateLicenseChange({
    octokit,
    repo: { org: repo.org, repo: repo.repo },
    ref: pull_request.head.sha,
  });

  const prDataOrNull = await constructPRData();
  if (!prDataOrNull) {
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };
  }
  const prData = prDataOrNull;

  const timelineEntry = {
    type: "pull_request",
    data: prData,
    score: BASELINE_SCORE * PULL_REQUEST_MULTIPLIER,
    repo_id: repo.id,
    dedupe_hash: dedupeHash,
    updated_at: pull_request.updated_at.toISOString(),
    event_ids: [event.id],
    is_read: false,
    search_text: [prData.pull_request.title, prData.pull_request.ai_summary]
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
    const isMyReview = user.github_username === pull_request.user.login;
    const isReviewAssignedToMe = !!pull_request.requested_reviewers?.some(
      (reviewer) => reviewer.login === user.github_username
    );

    userTimelineEntries.push({
      user_id: user.id,
      categories:
        isMyReview || isReviewAssignedToMe ? ["pull_requests"] : undefined,
      ...timelineEntry,
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
